// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/// @title Mock Chainlink‑style price oracle (8‑decimals)
contract MockOracle {
    /// @notice Same decimals as Chainlink feeds
    uint8 public constant decimals = 8;

    /// token => price (8‑decimals)
    mapping(address => uint256) private _price;

    /// @notice Manually set a mock price for `token`
    function setPrice(address token, uint256 price) external {
        _price[token] = price;
    }

    /// @notice Minimal interface required by PriceOracle.getPrice()
    /// @return price current mock price
    /// @return decs  fixed decimals (8)
    function getPrice(
        address token
    ) external view returns (uint256 price, uint8 decs) {
        price = _price[token];
        decs = decimals;
    }
}

/// @title Mock Interest‑Rate Model (always 0 %)
contract MockInterestRateModel {
    uint256 public constant RAY = 1e27;

    /// @notice Borrow rate is always 0 % (simplifies unit tests)
    function getBorrowRate(
        uint256 /*utilization*/
    ) external pure returns (uint256) {
        return 0;
    }

    /// @notice Deposit rate is always 0 %
    function getDepositRate(
        uint256 /*utilization*/,
        uint256 /*reserveFactor*/
    ) external pure returns (uint256) {
        return 0;
    }
}
