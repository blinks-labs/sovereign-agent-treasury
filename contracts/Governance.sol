// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/governance/Governor.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorSettings.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorCountingSimple.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorVotes.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorVotesQuorumFraction.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorTimelockControl.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Address.sol";

/**
 * @title SovereignTreasuryGovernance
 * @dev Governance contract for the Sovereign Agent Treasury
 * @notice This contract handles proposal creation, voting, and execution for treasury operations
 *         on the Monad blockchain.
 */
contract Governance is
    Governor,
    GovernorSettings,
    GovernorCountingSimple,
    GovernorVotes,
    GovernorVotesQuorumFraction,
    GovernorTimelockControl,
    AccessControl
{
    using Address for address;
    
    // ============ Roles ============
    
    /// @role AGENT_ROLE - Allows the treasury agent to submit proposals
    bytes32 public constant AGENT_ROLE = keccak256("AGENT_ROLE");
    
    /// @role GOVERNANCE_ADMIN - Can update governance parameters
    bytes32 public constant GOVERNANCE_ADMIN = keccak256("GOVERNANCE_ADMIN");
    
    /// @role PROPOSER_ROLE - Can create proposals (in addition to token holders)
    bytes32 public constant PROPOSER_ROLE = keccak256("PROPOSER_ROLE");
    
    // ============ Proposal Types ============
    
    enum ProposalType {
        General,           // Standard governance proposal
        TreasuryAction,    // Requires treasury contract interaction
        ParameterUpdate,   // Updates governance parameters
        Emergency         // Bypasses timelock for critical situations
    }
    
    // ============ State ============
    
    /// @notice Treasury contract address
    address public treasury;
    
    /// @notice Minimum token balance required to create a proposal
    uint256 public proposalThresholdTokens;
    
    /// @notice Mapping of proposal ID to proposal type
    mapping(uint256 => ProposalType) public proposalTypes;
    
    /// @notice Mapping of proposal ID to metadata URI
    mapping(uint256 => string) public proposalURIs;
    
    /// @notice Emergency proposals that skip timelock
    mapping(uint256 => bool) public emergencyProposals;
    
    // ============ Events ============
    
    event ProposalCreatedByAgent(
        uint256 indexed proposalId,
        address indexed agent,
        string description,
        ProposalType proposalType
    );
    
    event TreasuryAddressUpdated(address indexed newTreasury);
    
    event ProposalThresholdUpdated(uint256 newThreshold);
    
    event EmergencyProposalExecuted(uint256 indexed proposalId);
    
    event TreasuryActionProposed(
        uint256 indexed proposalId,
        address indexed target,
        uint256 value,
        bytes data
    );
    
    // ============ Errors ============
    
    error InvalidTreasuryAddress();
    error InvalidProposalThreshold();
    error UnauthorizedProposalCreator();
    error EmergencyProposalNotApproved();
    error ProposalAlreadyExecuted(uint256 proposalId);
    error ProposalTypeMismatch(uint256 proposalId, ProposalType expected);
    
    // ============ Modifiers ============
    
    /**
     * @dev Ensures the caller has sufficient voting power or appropriate role
     */
    modifier canSubmitProposal() {
        if (!hasRole(PROPOSER_ROLE, msg.sender) && !hasRole(AGENT_ROLE, msg.sender)) {
            require(
                getVotes(msg.sender, block.number - 1) >= proposalThresholdTokens,
                "Insufficient voting power"
            );
        }
        _;
    }
    
    /**
     * @dev Constructor
     * @param _token GOV token contract address
     * @param _timelock Timelock controller address
     * @param _treasury Treasury contract address
     * @param _proposalThreshold Minimum tokens to create proposal
     * @param _votingDelay Blocks before voting starts
     * @param _votingPeriod Duration of voting in blocks
     * @param _quorumNumerator Quorum percentage (4 = 4%)
     */
    constructor(
        IVotes _token,
        TimelockController _timelock,
        address _treasury,
        uint256 _proposalThreshold,
        uint48 _votingDelay,
        uint32 _votingPeriod,
        uint256 _quorumNumerator
    )
        Governor("SovereignTreasuryGovernance")
        GovernorSettings(
            _votingDelay,        // voting delay
            _votingPeriod,       // voting period
            0                    // proposal threshold (we handle this manually)
        )
        GovernorVotes(_token)
        GovernorVotesQuorumFraction(_quorumNumerator)
        GovernorTimelockControl(_timelock)
    {
        require(_treasury != address(0), "Invalid treasury");
        require(_proposalThreshold > 0, "Invalid threshold");
        
        treasury = _treasury;
        proposalThresholdTokens = _proposalThreshold;
        
        // Setup roles
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(GOVERNANCE_ADMIN, msg.sender);
        _grantRole(AGENT_ROLE, msg.sender);
        _grantRole(PROPOSER_ROLE, msg.sender);
        
        emit TreasuryAddressUpdated(_treasury);
        emit ProposalThresholdUpdated(_proposalThreshold);
    }
    
    // ============ Proposal Creation ============
    
    /**
     * @notice Create a proposal as a token holder
     * @param targets Contract addresses to call
     * @param values ETH values to send
     * @param calldatas Encoded function calls
     * @param description Proposal description
     * @return proposalId The ID of the created proposal
     */
    function propose(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        string memory description
    ) public override canSubmitProposal returns (uint256) {
        return super.propose(targets, values, calldatas, description);
    }
    
    /**
     * @notice Create a treasury action proposal (only AGENT_ROLE or PROPOSER_ROLE)
     * @param target Treasury contract or external contract
     * @param value ETH to send
     * @param data Encoded function call
     * @param description Proposal description
     * @param uri Additional metadata URI
     * @return proposalId The ID of the created proposal
     */
    function proposeTreasuryAction(
        address target,
        uint256 value,
        bytes memory data,
        string memory description,
        string memory uri
    ) external onlyRole(PROPOSER_ROLE) returns (uint256) {
        address[] memory targets = new address[](1);
        uint256[] memory values = new uint256[](1);
        bytes[] memory calldatas = new bytes[](1);
        
        targets[0] = target;
        values[0] = value;
        calldatas[0] = data;
        
        uint256 proposalId = propose(targets, values, calldatas, description);
        
        proposalTypes[proposalId] = ProposalType.TreasuryAction;
        proposalURIs[proposalId] = uri;
        
        emit TreasuryActionProposed(proposalId, target, value, data);
        
        return proposalId;
    }
    
    /**
     * @notice Create proposal as treasury agent
     * @dev Allows automated agents to submit proposals
     * @param targets Contract addresses to call
     * @param values ETH values to send
     * @param calldatas Encoded function calls
     * @param description Proposal description
     * @param proposalType Type of proposal being created
     * @param uri Metadata URI for proposal details
     * @return proposalId The ID of the created proposal
     */
    function proposeAsAgent(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        string memory description,
        ProposalType proposalType,
        string memory uri
    ) external onlyRole(AGENT_ROLE) returns (uint256) {
        uint256 proposalId = propose(targets, values, calldatas, description);
        
        proposalTypes[proposalId] = proposalType;
        proposalURIs[proposalId] = uri;
        
        emit ProposalCreatedByAgent(proposalId, msg.sender, description, proposalType);
        
        return proposalId;
    }
    
    /**
     * @notice Create an emergency proposal (skips timelock)
     * @dev Only callable by governance admin or agent with special authorization
     * @param targets Contract addresses to call
     * @param values ETH values to send
     * @param calldatas Encoded function calls
     * @param description Proposal description
     * @return proposalId The ID of the created emergency proposal
     */
    function proposeEmergency(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        string memory description
    ) external onlyRole(GOVERNANCE_ADMIN) returns (uint256) {
        uint256 proposalId = propose(targets, values, calldatas, description);
        
        emergencyProposals[proposalId] = true;
        proposalTypes[proposalId] = ProposalType.Emergency;
        
        emit ProposalCreatedByAgent(proposalId, msg.sender, description, ProposalType.Emergency);
        
        return proposalId;
    }
    
    // ============ Execution ============
    
    /**
     * @notice Execute a successful proposal
     * @param targets Contract addresses to call
     * @param values ETH values to send
     * @param calldatas Encoded function calls
     * @param descriptionHash Hash of proposal description
     */
    function execute(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) public payable override {
        uint256 proposalId = hashProposal(targets, values, calldatas, descriptionHash);
        
        // Check if emergency proposal
        if (emergencyProposals[proposalId]) {
            _executeEmergency(targets, values, calldatas, descriptionHash);
            emit EmergencyProposalExecuted(proposalId);
        } else {
            super.execute(targets, values, calldatas, descriptionHash);
        }
    }
    
    /**
     * @dev Execute emergency proposal without timelock
     */
    function _executeEmergency(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) internal {
        uint256 proposalId = hashProposal(targets, values, calldatas, descriptionHash);
        
        require(state(proposalId) == ProposalState.Succeeded, "Proposal not successful");
        
        _executeOperations(targets, values, calldatas, descriptionHash);
        
        // Mark as executed
        emergencyProposals[proposalId] = false;
    }
    
    // ============ View Functions ============
    
    /**
     * @notice Get the current state of a proposal
     * @param proposalId The ID of the proposal
     * @return The current proposal state
     */
    function state(
        uint256 proposalId
    ) public view override(Governor, GovernorTimelockControl) returns (ProposalState) {
        return super.state(proposalId);
    }
    
    /**
     * @notice Check if a proposal requires a quorum
     * @param blockNumber The block number to check
     * @param votes For, against, and abstain votes
     */
    function _quorumReached(
        uint256 blockNumber,
        uint256[] memory votes
    ) internal view override returns (bool) {
        uint256 totalVotes = votes[0] + votes[1] + votes[2];
        return totalVotes >= quorum(blockNumber);
    }
    
    /**
     * @notice Check if a proposal vote succeeded
     * @param votes For, against, and abstain votes
     */
    function _voteSucceeded(
        uint256[] memory votes
    ) internal pure override returns (bool) {
        return votes[0] > votes[1]; // more for than against
    }
    
    // ============ Admin Functions ============
    
    /**
     * @notice Update the treasury contract address
     * @param _treasury New treasury address
     */
    function setTreasury(address _treasury) external onlyRole(GOVERNANCE_ADMIN) {
        require(_treasury != address(0), "Invalid address");
        treasury = _treasury;
        emit TreasuryAddressUpdated(_treasury);
    }
    
    /**
     * @notice Update the proposal threshold
     * @param _threshold New threshold in tokens
     */
    function setProposalThresholdTokens(
        uint256 _threshold
    ) external onlyRole(GOVERNANCE_ADMIN) {
        require(_threshold > 0, "Invalid threshold");
        proposalThresholdTokens = _threshold;
        emit ProposalThresholdUpdated(_threshold);
    }
    
    /**
     * @notice Grant agent role to an address
     * @param agent Address to grant role to
     */
    function grantAgentRole(address agent) external onlyRole(GOVERNANCE_ADMIN) {
        _grantRole(AGENT_ROLE, agent);
    }
    
    /**
     * @notice Revoke agent role
     * @param agent Address to revoke role from
     */
    function revokeAgentRole(address agent) external onlyRole(GOVERNANCE_ADMIN) {
        _revokeRole(AGENT_ROLE, agent);
    }
    
    /**
     * @notice Grant proposer role
     * @param proposer Address to grant role to
     */
    function grantProposerRole(address proposer) external onlyRole(GOVERNANCE_ADMIN) {
        _grantRole(PROPOSER_ROLE, proposer);
    }
    
    /**
     * @notice Revoke proposer role
     * @param proposer Address to revoke role from
     */
    function revokeProposerRole(address proposer) external onlyRole(GOVERNANCE_ADMIN) {
        _revokeRole(PROPOSER_ROLE, proposer);
    }
    
    // ============ Required Overrides ============
    
    function votingDelay()
        public
        view
        override(Governor, GovernorSettings)
        returns (uint256)
    {
        return super.votingDelay();
    }
    
    function votingPeriod()
        public
        view
        override(Governor, GovernorSettings)
        returns (uint256)
    {
        return super.votingPeriod();
    }
    
    function proposalThreshold()
        public
        view
        override(Governor, GovernorSettings)
        returns (uint256)
    {
        // We manually control threshold, return 0 here
        return 0;
    }
    
    function proposalNeedsQueuing(
        uint256 proposalId
    ) public view override(Governor, GovernorTimelockControl) returns (bool) {
        // Emergency proposals don't need queuing
        if (emergencyProposals[proposalId]) return false;
        return super.proposalNeedsQueuing(proposalId);
    }
    
    function _queueOperations(
        uint256 proposalId,
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) internal override(Governor, GovernorTimelockControl) returns (uint48) {
        return super._queueOperations(
            proposalId,
            targets,
            values,
            calldatas,
            descriptionHash
        );
    }
    
    function _executeOperations(
        uint256 proposalId,
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) internal override(Governor, GovernorTimelockControl) {
        super._executeOperations(
            proposalId,
            targets,
            values,
            calldatas,
            descriptionHash
        );
    }
    
    function _cancel(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) internal override(Governor, GovernorTimelockControl) returns (uint256) {
        return super._cancel(targets, values, calldatas, descriptionHash);
    }
    
    function _executor()
        internal
        view
        override(Governor, GovernorTimelockControl)
        returns (address)
    {
        return super._executor();
    }
    
    function supportsInterface(
        bytes4 interfaceId
    ) public view override(Governor, AccessControl) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
    
    // ============ Additional Features ============
    
    /**
     * @notice Get proposal details including type and metadata
     * @param proposalId The proposal ID
     * @return proposalType Type of proposal
     * @return uri Metadata URI
     * @return isEmergency Whether it's an emergency proposal
     */
    function getProposalDetails(
        uint256 proposalId
    ) external view returns (
        ProposalType proposalType,
        string memory uri,
        bool isEmergency
    ) {
        return (
            proposalTypes[proposalId],
            proposalURIs[proposalId],
            emergencyProposals[proposalId]
        );
    }
    
    /**
     * @notice Get the name of this governor instance
     */
    function name() public view override returns (string memory) {
        return "Sovereign Treasury Governance";
    }
    
    /**
     * @notice Get the version of this governor
     */
    function version() public view pure override returns (string memory) {
        return "1";
    }
    
    /**
     * @notice Get the token contract address
     */
    function token() public view returns (IVotes) {
        return _token;
    }
    
    /**
     * @notice Get the timelock address
     */
    function timelock() public view returns (TimelockController) {
        return _timelock;
    }
}