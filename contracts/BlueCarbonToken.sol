// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title BlueCarbonToken
 * @dev ERC20 token representing verified blue carbon credits
 * Each token represents 1 tonne of CO2 equivalent sequestered in blue carbon ecosystems
 */
contract BlueCarbonToken is ERC20, AccessControl, Pausable {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    
    // Track retired (burned) tokens for transparency
    uint256 public totalRetired;
    
    // Events
    event TokensRetired(address indexed account, uint256 amount, string retirementReason);
    event TokensMinted(address indexed to, uint256 amount, string mrvCid);
    
    // Mapping to track retirement history
    mapping(address => uint256) public retiredByAccount;
    
    constructor(
        string memory name,
        string memory symbol,
        address defaultAdmin
    ) ERC20(name, symbol) {
        _grantRole(DEFAULT_ADMIN_ROLE, defaultAdmin);
        _grantRole(MINTER_ROLE, defaultAdmin);
        _grantRole(PAUSER_ROLE, defaultAdmin);
    }
    
    /**
     * @dev Mint tokens to account - only callable by MINTER_ROLE (Registry contract)
     * @param to Address to mint tokens to
     * @param amount Amount of tokens to mint
     * @param mrvCid IPFS CID of the MRV package that justified this mint
     */
    function mint(address to, uint256 amount, string memory mrvCid) 
        public 
        onlyRole(MINTER_ROLE) 
        whenNotPaused 
    {
        _mint(to, amount);
        emit TokensMinted(to, amount, mrvCid);
    }
    
    /**
     * @dev Retire (burn) tokens to offset carbon emissions
     * @param amount Amount of tokens to retire
     * @param reason Reason for retirement (e.g., "Corporate offsetting Q4 2024")
     */
    function retire(uint256 amount, string memory reason) public whenNotPaused {
        require(balanceOf(msg.sender) >= amount, "Insufficient balance");
        
        _burn(msg.sender, amount);
        totalRetired += amount;
        retiredByAccount[msg.sender] += amount;
        
        emit TokensRetired(msg.sender, amount, reason);
    }
    
    /**
     * @dev Pause the contract - emergency stop
     */
    function pause() public onlyRole(PAUSER_ROLE) {
        _pause();
    }
    
    /**
     * @dev Unpause the contract
     */
    function unpause() public onlyRole(PAUSER_ROLE) {
        _unpause();
    }
    
    /**
     * @dev Get retirement history for an account
     */
    function getRetiredAmount(address account) public view returns (uint256) {
        return retiredByAccount[account];
    }
    
    /**
     * @dev Override transfer to add pause functionality
     */
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal whenNotPaused override {
        super._beforeTokenTransfer(from, to, amount);
    }
}