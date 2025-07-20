// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract MockAggregator {
    int256 private _answer;
    uint8 private immutable _decimals;
    uint256 private _updatedAt;

    constructor(uint8 decimals_) {
        _decimals = decimals_;
        _updatedAt = block.timestamp;
    }

    function setAnswer(int256 newAnswer) external {
        _answer = newAnswer;
        _updatedAt = block.timestamp;
    }

    function latestRoundData()
        external
        view
        returns (
            uint80, 
            int256 answer,
            uint256,
            uint256 updatedAt,
            uint80 
        )
    {
        return (0, _answer, 0, _updatedAt, 0);
    }

    function decimals() external view returns (uint8) {
        return _decimals;
    }
}
