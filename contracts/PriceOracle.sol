// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/**
 * @title PriceOracle
 * @notice Simple wrapper around Chainlink feeds used by LendiFi.
 */

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/* Minimal Chainlink AggregatorV3 interface */
interface AggregatorV3Interface {
    function latestRoundData()
        external
        view
        returns (uint80, int256, uint256, uint256, uint80);

    function decimals() external view returns (uint8);
}

contract PriceOracle is Ownable, Pausable {
    mapping(address => AggregatorV3Interface) private _feeds; // token ⇒ feed

    event FeedSet(address indexed token, address indexed feed);

    constructor() Ownable(msg.sender) {}

    /* ───── Admin ───── */

    /// Register or update a Chainlink feed for `token`.
    function setFeed(address token, address feed) external onlyOwner {
        require(token != address(0) && feed != address(0), "ZERO_ADDR");
        _feeds[token] = AggregatorV3Interface(feed);
        emit FeedSet(token, feed);
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    /* ───── Views ───── */

    /// @return price  latest price
    /// @return decimals feed decimals (needed for normalization)
    function getPrice(
        address token
    ) external view whenNotPaused returns (uint256 price, uint8 decimals) {
        AggregatorV3Interface feed = _feeds[token];
        require(address(feed) != address(0), "FEED_NOT_SET");

        (, int256 answer, , uint256 updatedAt, ) = feed.latestRoundData();
        require(answer > 0, "INVALID_PRICE");
        require(updatedAt != 0, "INACTIVE_FEED");

        return (uint256(answer), feed.decimals());
    }

    function getFeed(address token) external view returns (address) {
        return address(_feeds[token]);
    }
}
