// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/* -------------------------------------------------------------------------- */
/*                         Mock Chainlink-style Oracle                        */
/* -------------------------------------------------------------------------- */
contract MockOracle {
    uint8 public constant decimals = 8; // igual que Chainlink
    mapping(address => uint256) private _price; // token ⇒ precio

    /** Permite fijar un precio manualmente. */
    function setPrice(address token, uint256 price) external {
        _price[token] = price;
    }

    /**
     * Versión mínima compatible con tu PriceOracle.getPrice:
     * devuelve (price, decimals).
     */
    function getPrice(
        address token
    ) external view returns (uint256 price, uint8 decs) {
        price = _price[token];
        decs = decimals;
    }
}

/* -------------------------------------------------------------------------- */
/*                     Mock Interest-Rate-Model (todo 0 %)                    */
/* -------------------------------------------------------------------------- */
contract MockInterestRateModel {
    uint256 public constant RAY = 1e27;

    /** 0 % para cualquier utilización -> facilita los tests. */
    function getBorrowRate(
        uint256 /*utilization*/
    ) external pure returns (uint256) {
        return 0;
    }

    /** 0 % depósitos. */
    function getDepositRate(
        uint256 /*utilization*/,
        uint256 /*reserveFactor*/
    ) external pure returns (uint256) {
        return 0;
    }
}
