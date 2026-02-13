// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Script.sol";
import "@openzeppelin/contracts/governance/TimelockController.sol";
import "../contracts/GOVToken.sol";
import "../contracts/Governance.sol";

/**
 * @title DeployGovernance
 * @dev Foundry deployment script for Sovereign Agent Treasury governance contracts
 * @notice Deploys on Monad testnet (chainId: 10143)
 * 
 * Usage:
 *   forge script script/DeployGovernance.s.sol:DeployGovernance \
 *     --rpc-url https://testnet-rpc.monad.xyz \
 *     --private-key $PRIVATE_KEY \
 *     --broadcast \
 *     --verify
 */
contract DeployGovernance is Script {
    
    // ============ Configuration ============
    
    /// @notice Monad testnet chain ID
    uint256 constant MONAD_TESTNET_CHAIN_ID = 10143;
    
    /// @notice Treasury agent wallet (receives initial tokens)
    address constant TREASURY_AGENT = 0x71bFE76f99b01034ad6AC7E9D0D9b06A186fbC62;
    
    /// @notice Pre-deployed GOV token address (for integration mode)
    address constant EXISTING_GOV_TOKEN = 0x1Cf957ce9d0347770660C754037021C1dCE27777;
    
    /// @notice Governance parameters
    uint256 constant PROPOSAL_THRESHOLD = 1000e18;      // 1,000 GOV tokens
    uint48 constant VOTING_DELAY = 1;                    // 1 block
    uint32 constant VOTING_PERIOD = 50400;              // ~1 week (assuming 12s blocks)
    uint256 constant QUORUM_NUMERATOR = 400;            // 4% quorum (basis points)
    
    /// @notice Timelock parameters
    uint256 constant MIN_DELAY = 2 days;                // 2 day delay for execution
    
    // ============ Deployed Addresses ============
    
    struct Deployment {
        address govToken;
        address governance;
        address timelock;
        uint256 timestamp;
        uint256 chainId;
        address deployer;
    }
    
    Deployment public deployment;
    
    // ============ Events ============
    
    event ContractsDeployed(
        address indexed govToken,
        address indexed governance,
        address indexed timelock,
        uint256 timestamp
    );
    
    // ============ Deployment Functions ============
    
    /**
     * @notice Run the full deployment
     * @dev This deploys all three contracts in sequence
     */
    function run() external {
        // Validate chain
        require(block.chainid == MONAD_TESTNET_CHAIN_ID, "Wrong chain - use Monad testnet");
        
        // Get deployer from env or default to agent
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        console.log("============================================");
        console.log("Sovereign Agent Treasury - Governance Deploy");
        console.log("============================================");
        console.log("Chain ID:", block.chainid);
        console.log("Deployer:", deployer);
        console.log("Treasury Agent:", TREASURY_AGENT);
        console.log("");
        
        vm.startBroadcast(deployerPrivateKey);
        
        // Step 1: Deploy GOV Token
        console.log("[1/3] Deploying GOVToken...");
        GOVToken govToken = new GOVToken(deployer, TREASURY_AGENT);
        console.log("  GOVToken deployed at:", address(govToken));
        console.log("  Initial supply minted to treasury agent");
        
        // Step 2: Deploy TimelockController
        console.log("");
        console.log("[2/3] Deploying TimelockController...");
        
        // Setup timelock roles
        address[] memory proposers = new address[](1);
        address[] memory executors = new address[](1);
        
        // We'll set the governance contract as proposer after deployment
        // For now, use deployer (will transfer later)
        proposers[0] = deployer;
        executors[0] = address(0); // Anyone can execute
        
        TimelockController timelock = new TimelockController(
            MIN_DELAY,
            proposers,
            executors,
            deployer // admin
        );
        console.log("  TimelockController deployed at:", address(timelock));
        console.log("  Min delay:", MIN_DELAY, "seconds");
        
        // Step 3: Deploy Governance
        console.log("");
        console.log("[3/3] Deploying Governance contract...");
        
        Governance governance = new Governance(
            IVotes(address(govToken)),
            timelock,
            TREASURY_AGENT,      // treasury address
            PROPOSAL_THRESHOLD,
            VOTING_DELAY,
            VOTING_PERIOD,
            QUORUM_NUMERATOR
        );
        console.log("  Governance deployed at:", address(governance));
        console.log("  Proposal threshold:", PROPOSAL_THRESHOLD / 1e18, "GOV");
        console.log("  Voting delay:", VOTING_DELAY, "blocks");
        console.log("  Voting period:", VOTING_PERIOD, "blocks");
        console.log("  Quorum:", QUORUM_NUMERATOR / 100, "%");
        
        // Step 4: Setup timelock roles properly
        console.log("");
        console.log("[Setup] Configuring Timelock roles...");
        
        // Grant governance contract proposer role
        timelock.grantRole(timelock.PROPOSER_ROLE(), address(governance));
        console.log("  Granted PROPOSER_ROLE to Governance");
        
        // Grant timelock canceller role to governance
        timelock.grantRole(timelock.CANCELLER_ROLE(), address(governance));
        console.log("  Granted CANCELLER_ROLE to Governance");
        
        // Grant agent role to treasury agent
        governance.grantAgentRole(TREASURY_AGENT);
        console.log("  Granted AGENT_ROLE to Treasury Agent");
        
        // Transfer GOV token ownership to timelock (governance controls minting)
        govToken.transferOwnership(address(timelock));
        console.log("  Transferred GOVToken ownership to Timelock");
        
        // Renounce timelock admin role (make governance truly decentralized)
        timelock.renounceRole(timelock.DEFAULT_ADMIN_ROLE(), deployer);
        console.log("  Renounced Timelock admin role");
        
        vm.stopBroadcast();
        
        // Save deployment info
        deployment = Deployment({
            govToken: address(govToken),
            governance: address(governance),
            timelock: address(timelock),
            timestamp: block.timestamp,
            chainId: block.chainid,
            deployer: deployer
        });
        
        // Write deployment addresses to JSON
        _saveDeployment();
        
        // Emit event
        emit ContractsDeployed(
            address(govToken),
            address(governance),
            address(timelock),
            block.timestamp
        );
        
        // Final summary
        console.log("");
        console.log("============================================");
        console.log("DEPLOYMENT COMPLETE");
        console.log("============================================");
        console.log("GOVToken:    ", address(govToken));
        console.log("Governance:  ", address(governance));
        console.log("Timelock:    ", address(timelock));
        console.log("============================================");
    }
    
    /**
     * @notice Deploy only with existing GOV token
     * @dev Use this when GOV token is already deployed at EXISTING_GOV_TOKEN
     */
    function runWithExistingToken() external {
        require(
            EXISTING_GOV_TOKEN != address(0),
            "No existing token address configured"
        );
        
        // Validate chain
        require(block.chainid == MONAD_TESTNET_CHAIN_ID, "Wrong chain - use Monad testnet");
        
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        console.log("============================================");
        console.log("Governance Deploy (Existing Token Mode)");
        console.log("============================================");
        console.log("Using existing GOVToken:", EXISTING_GOV_TOKEN);
        console.log("Chain ID:", block.chainid);
        console.log("Deployer:", deployer);
        console.log("");
        
        vm.startBroadcast(deployerPrivateKey);
        
        // Deploy Timelock
        console.log("[1/2] Deploying TimelockController...");
        address[] memory proposers = new address[](1);
        address[] memory executors = new address[](1);
        proposers[0] = deployer;
        executors[0] = address(0);
        
        TimelockController timelock = new TimelockController(
            MIN_DELAY,
            proposers,
            executors,
            deployer
        );
        console.log("  Timelock:", address(timelock));
        
        // Deploy Governance with existing token
        console.log("[2/2] Deploying Governance...");
        Governance governance = new Governance(
            IVotes(EXISTING_GOV_TOKEN),
            timelock,
            TREASURY_AGENT,
            PROPOSAL_THRESHOLD,
            VOTING_DELAY,
            VOTING_PERIOD,
            QUORUM_NUMERATOR
        );
        console.log("  Governance:", address(governance));
        
        // Setup roles
        timelock.grantRole(timelock.PROPOSER_ROLE(), address(governance));
        timelock.grantRole(timelock.CANCELLER_ROLE(), address(governance));
        governance.grantAgentRole(TREASURY_AGENT);
        timelock.renounceRole(timelock.DEFAULT_ADMIN_ROLE(), deployer);
        
        vm.stopBroadcast();
        
        deployment = Deployment({
            govToken: EXISTING_GOV_TOKEN,
            governance: address(governance),
            timelock: address(timelock),
            timestamp: block.timestamp,
            chainId: block.chainid,
            deployer: deployer
        });
        
        _saveDeployment();
        
        console.log("");
        console.log("============================================");
        console.log("DEPLOYMENT COMPLETE (Integration Mode)");
        console.log("============================================");
        console.log("GOVToken:    ", EXISTING_GOV_TOKEN, "(existing)");
        console.log("Governance:  ", address(governance));
        console.log("Timelock:    ", address(timelock));
    }
    
    /**
     * @notice Save deployment addresses to JSON file
     */
    function _saveDeployment() internal {
        string memory json = string.concat(
            '{\n',
            '  "chainId": ', vm.toString(deployment.chainId), ',\n',
            '  "timestamp": ', vm.toString(deployment.timestamp), ',\n',
            '  "deployer": "', vm.toString(deployment.deployer), '",\n',
            '  "contracts": {\n',
            '    "GOVToken": "', vm.toString(deployment.govToken), '",\n',
            '    "Governance": "', vm.toString(deployment.governance), '",\n',
            '    "TimelockController": "', vm.toString(deployment.timelock), '"\n',
            '  },\n',
            '  "configuration": {\n',
            '    "proposalThreshold": ', vm.toString(PROPOSAL_THRESHOLD), ',\n',
            '    "votingDelay": ', vm.toString(VOTING_DELAY), ',\n',
            '    "votingPeriod": ', vm.toString(VOTING_PERIOD), ',\n',
            '    "quorumNumerator": ', vm.toString(QUORUM_NUMERATOR), ',\n',
            '    "timelockMinDelay": ', vm.toString(MIN_DELAY), '\n',
            '  },\n',
            '  "roles": {\n',
            '    "treasuryAgent": "', vm.toString(TREASURY_AGENT), '"\n',
            '  }\n',
            '}'
        );
        
        string memory filename = string.concat(
            "deployments/monad-testnet-",
            vm.toString(block.timestamp),
            ".json"
        );
        
        // Create deployments directory if it doesn't exist
        vm.createDir("deployments", true);
        
        // Write to file
        vm.writeFile(filename, json);
        
        // Also write latest.json
        vm.writeFile("deployments/latest.json", json);
        
        console.log("");
        console.log("Deployment saved to:", filename);
        console.log("Latest deployment: deployments/latest.json");
    }
    
    /**
     * @notice Get deployment info
     */
    function getDeployment() external view returns (Deployment memory) {
        return deployment;
    }
}
