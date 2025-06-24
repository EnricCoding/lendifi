// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title AToken
 * @notice Token de depósito de LendiFi. Se miente/quem a través de LendingPool.
 */
contract AToken is ERC20, Ownable {
    constructor(
        string memory name,
        string memory symbol
    ) ERC20(name, symbol) Ownable(msg.sender) {}

    /**
     * @notice Mienta aTokens. Solo puede llamarlo el LendingPool (owner).
     */
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }

    /**
     * @notice Quema aTokens. Solo puede llamarlo el LendingPool (owner).
     */
    function burn(address from, uint256 amount) external onlyOwner {
        _burn(from, amount);
    }
}
