// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/**
 * @title PriceOracle
 * @notice Oráculo sencillo que lee precios desde feeds de Chainlink
 *         y los expone al protocolo LendiFi.
 * @dev Compatible con OpenZeppelin Contracts v5.
 */

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @dev Interfaz mínima de AggregatorV3 de Chainlink.
 */
interface AggregatorV3Interface {
    function latestRoundData()
        external
        view
        returns (
            uint80 roundId,
            int256 answer,
            uint256 startedAt,
            uint256 updatedAt,
            uint80 answeredInRound
        );

    function decimals() external view returns (uint8);
}

contract PriceOracle is Ownable, Pausable {
    // token => feed
    constructor() Ownable(msg.sender) {}

    // token => feed
    mapping(address => AggregatorV3Interface) private _feeds;

    /// @notice Emitted when a new price feed is set for a token.
    event FeedSet(address indexed token, address indexed feed);

    // ────────────────────────────────────────────────────────────────────────────
    // ▸ Admin functions
    // ────────────────────────────────────────────────────────────────────────────

    /**
     * @notice Registra o actualiza un feed de Chainlink para un token.
     * @param token Dirección del token.
     * @param feed Dirección del AggregatorV3.
     */
    function setFeed(address token, address feed) external onlyOwner {
        require(token != address(0) && feed != address(0), "ZERO_ADDR");
        _feeds[token] = AggregatorV3Interface(feed);
        emit FeedSet(token, feed);
    }

    /**
     * @notice Pausa las consultas de precios.
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @notice Reactiva el oráculo.
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    // ────────────────────────────────────────────────────────────────────────────
    // ▸ Public view
    // ────────────────────────────────────────────────────────────────────────────

    /**
     * @notice Obtiene el precio más reciente de un token.
     * @dev Devuelve precio como int256 convertido a uint256.
     * @param token Dirección del token.
     * @return price  Precio con la misma escala de decimales que el feed.
     * @return decimals Número de decimales del feed (útil para normalizar).
     */
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

    /**
     * @notice Devuelve la dirección del feed de un token.
     */
    function getFeed(address token) external view returns (address) {
        return address(_feeds[token]);
    }
}
