// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/**
 * @title InterestRateModel
 * @notice Two‑segment linear curve (Aave‑style): slope 1 below the optimal
 *         utilization, slope 2 above. Rates are returned in RAY/second (1 RAY = 1e27).
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

    /// @dev Curve parameters (all rates in RAY/second; `optimal` in WAD).
    struct Params {
        uint256 baseRate; // borrow rate when utilisation = 0
        uint256 slope1; // rate gradient below `optimal`
        uint256 slope2; // rate gradient above `optimal`
        uint256 optimal; // optimal utilisation (1e18 = 100 %)
    }

    Params public params;
    event ParamsUpdated(Params p);

    constructor(Params memory p) Ownable(msg.sender) {
        _updateParams(p);
    }

    /// @notice Borrow rate in RAY/second for a given utilisation (WAD).
    function getBorrowRate(
        uint256 utilizationWad
    ) public view returns (uint256) {
        if (utilizationWad <= params.optimal) {
            uint256 factor = (utilizationWad * WadRayMath.WAD) / params.optimal;
            return
                params.baseRate +
                params.slope1.rayMul(
                    (factor * WadRayMath.RAY) / WadRayMath.WAD
                );
        } else {
            uint256 excess = utilizationWad - params.optimal;
            uint256 denominator = WadRayMath.WAD - params.optimal;
            uint256 factor = (excess * WadRayMath.WAD) / denominator;
            return
                params.baseRate +
                params.slope1 +
                params.slope2.rayMul(
                    (factor * WadRayMath.RAY) / WadRayMath.WAD
                );
        }
    }

  
    function getDepositRate(
        uint256 utilizationWad,
        uint256 reserveFactorWad
    ) external view returns (uint256) {
        uint256 borrowRate = getBorrowRate(utilizationWad); // RAY/sec

        uint256 utilRay = (utilizationWad * WadRayMath.RAY) / WadRayMath.WAD;
        uint256 rfRay = ((WadRayMath.WAD - reserveFactorWad) * WadRayMath.RAY) /
            WadRayMath.WAD;

        return borrowRate.rayMul(utilRay).rayMul(rfRay);
    }

    /// @notice Owner can update curve parameters.
    function updateParams(Params memory p) external onlyOwner {
        _updateParams(p);
    }

    function _updateParams(Params memory p) internal {
        require(p.optimal > 0 && p.optimal < WadRayMath.WAD, "BAD_OPTIMAL");
        params = p;
        emit ParamsUpdated(p);
    }
}
