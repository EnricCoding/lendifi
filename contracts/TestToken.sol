// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @dev Token sencillo para tests; cualquiera puede acuñar.
contract TestToken is ERC20 {
    constructor() ERC20("Mock DAI", "mDAI") {}

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}
