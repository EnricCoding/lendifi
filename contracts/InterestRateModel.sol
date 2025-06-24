// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/**
 * @title InterestRateModel
 * @notice Estrategia lineal segmentada para LendiFi.
 *         Inspirada en Aave v2: dos tramos (antes/después del punto óptimo).
 * @dev   Todas las tasas se expresan en RAYs (1e27) por segundo.
 */

import "@openzeppelin/contracts/access/Ownable.sol";

library WadRayMath {
    uint256 internal constant WAD = 1e18;
    uint256 internal constant RAY = 1e27;

    function rayMul(uint256 a, uint256 b) internal pure returns (uint256) {
        return (a * b + RAY / 2) / RAY;
    }
}

contract InterestRateModel is Ownable {
    using WadRayMath for uint256;

    // ────────────────────────────────────────────────────────────────────────────
    // ▸ Parámetros de la curva
    // ────────────────────────────────────────────────────────────────────────────
    struct Params {
        uint256 baseRate; // tasa mínima cuando U = 0     (ray/sec)
        uint256 slope1; // pendiente antes del óptimo   (ray/sec)
        uint256 slope2; // pendiente después del óptimo (ray/sec)
        uint256 optimal; // Utilización óptima, en WAD (1e18 = 100%)
    }

    Params public params;

    event ParamsUpdated(Params p);

    constructor(Params memory p) Ownable(msg.sender) {
        _updateParams(p);
    }

    /**
     * @notice Devuelve la tasa de préstamo (ray/seg) dada la utilización U (WAD).
     */
    function getBorrowRate(
        uint256 utilizationWad
    ) public view returns (uint256) {
        if (utilizationWad <= params.optimal) {
            // tramo 1: base + slope1 * U / optimal
            uint256 factor = (utilizationWad * WadRayMath.WAD) / params.optimal; // escala a WAD
            return
                params.baseRate +
                params.slope1.rayMul(
                    (factor * WadRayMath.RAY) / WadRayMath.WAD
                );
        } else {
            // tramo 2: base + slope1 + slope2 * (U - optimal)/(1-optimal)
            uint256 excess = utilizationWad - params.optimal;
            uint256 denominator = WadRayMath.WAD - params.optimal; // siempre >0
            uint256 factor = (excess * WadRayMath.WAD) / denominator;
            return
                params.baseRate +
                params.slope1 +
                params.slope2.rayMul(
                    (factor * WadRayMath.RAY) / WadRayMath.WAD
                );
        }
    }

    /**
     * @notice Estima la tasa de depósito aplicando un share = borrowRate * U * (1 - reserveFactor).
     * @param utilizationWad Utilización (totalDebt / totalCollateral) en WAD.
     * @param reserveFactorWad Parte de intereses destinada a la tesorería, en WAD.
     */
    function getDepositRate(
        uint256 utilizationWad,
        uint256 reserveFactorWad
    ) external view returns (uint256) {
        uint256 borrowRate = getBorrowRate(utilizationWad);
        uint256 oneMinusRF = WadRayMath.WAD - reserveFactorWad;
        return
            borrowRate.rayMul(utilizationWad).rayMul(
                (oneMinusRF * WadRayMath.RAY) / WadRayMath.WAD
            );
    }

    /** @dev Solo owner puede ajustar la curva. */
    function updateParams(Params memory p) external onlyOwner {
        _updateParams(p);
    }

    function _updateParams(Params memory p) internal {
        require(p.optimal > 0 && p.optimal < WadRayMath.WAD, "BAD_OPTIMAL");
        params = p;
        emit ParamsUpdated(p);
    }
}
