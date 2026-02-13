// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title GOVToken
 * @dev Governance token for the Sovereign Agent Treasury
 * @notice This token is used for governance voting rights in the DAO
 */
contract GOVToken is ERC20, ERC20Permit, ERC20Votes, Ownable {
    
    /// @notice Maximum token supply
    uint256 public constant MAX_SUPPLY = 10_000_000 * 10**18; // 10 million tokens
    
    /// @notice Emitted when tokens are minted for governance purposes
    event GovernanceMint(address indexed to, uint256 amount);
    
    /**
     * @dev Constructor initializes the token with name, symbol, and mints initial supply
     * @param initialOwner Address that will own the contract
     * @param treasury Address to receive initial token distribution
     */
    constructor(
        address initialOwner,
        address treasury
    ) 
        ERC20("Sovereign Governance", "GOV") 
        ERC20Permit("Sovereign Governance")
        Ownable(initialOwner)
    {
        require(treasury != address(0), "Invalid treasury address");
        
        // Mint 100% of supply to treasury for distribution
        _mint(treasury, MAX_SUPPLY);
        emit GovernanceMint(treasury, MAX_SUPPLY);
    }
    
    /**
     * @notice Mint additional tokens (requires governance approval in production)
     * @dev In production, this would be controlled by the governance contract
     * @param to Address to receive the minted tokens
     * @param amount Amount to mint
     */
    function mint(address to, uint256 amount) external onlyOwner {
        require(totalSupply() + amount <= MAX_SUPPLY, "Exceeds max supply");
        _mint(to, amount);
        emit GovernanceMint(to, amount);
    }
    
    // Required overrides for ERC20Votes and ERC20Permit
    function _update(
        address from,
        address to,
        uint256 value
    ) internal override(ERC20, ERC20Votes) {
        super._update(from, to, value);
    }
    
    function nonces(
        address owner
    ) public view override(ERC20Permit, Nonces) returns (uint256) {
        return super.nonces(owner);
    }
    
    /**
     * @notice Get the current voting power of an account
     * @param account The address to check
     * @return The voting power at the current block
     */
    function getVotes(address account) public view override returns (uint256) {
        return super.getVotes(account);
    }
    
    /**
     * @notice Get the voting power of an account at a specific block
     * @param account The address to check
     * @param blockNumber The block number to query
     * @return The voting power at the specified block
     */
    function getPastVotes(
        address account,
        uint256 blockNumber
    ) public view override returns (uint256) {
        return super.getPastVotes(account, blockNumber);
    }
}