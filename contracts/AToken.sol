// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title LendiFi aToken
 * @dev Interest‑bearing token; only the LendingPool (contract owner) can mint or burn.
 */
contract AToken is ERC20, Ownable {
    constructor(
        string memory name,
        string memory symbol
    ) ERC20(name, symbol) Ownable(msg.sender) {}

    /// Mint aTokens to `to`; callable only by LendingPool.
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }

    /// Burn aTokens from `from`; callable only by LendingPool.
    function burn(address from, uint256 amount) external onlyOwner {
        _burn(from, amount);
    }
}
