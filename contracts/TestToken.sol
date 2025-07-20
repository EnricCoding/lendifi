// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @title TestToken — unrestricted ERC‑20 mintable by anyone (for demos/tests)
contract TestToken is ERC20 {
    constructor() ERC20("Mock DAI", "mDAI") {}

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}
