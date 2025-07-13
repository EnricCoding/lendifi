// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/**
 * @title  LendingPool (LendiFi v0.4-a)
 * @notice Depósitos, préstamos, repagos y liquidaciones con chequeo de Health-Factor.
 */

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "./AToken.sol";
import "./PriceOracle.sol";
import "./InterestRateModel.sol"; // ▸ WadRayMath incluida

contract LendingPool is ReentrancyGuard, Pausable, Ownable {
    using SafeERC20 for IERC20;
    using WadRayMath for uint256;

    /* ───────────────────────── constantes ───────────────────────── */
    uint256 private constant RAY = 1e27;
    uint256 private constant WAD = 1e18;
    uint256 private constant MAX_LTV_WAD = 8e17; // 80 %
    uint256 private constant LIQ_BONUS_WAD = 105e16; // 5 % bonus → 1.05 WAD

    /* ───────────────────────── dependencias ─────────────────────── */
    AToken public immutable aToken;
    PriceOracle public immutable oracle;
    InterestRateModel public immutable rateModel;

    constructor(
        AToken _aToken,
        PriceOracle _oracle,
        InterestRateModel _rateModel
    ) Ownable(msg.sender) {
        require(address(_aToken) != address(0), "ATOKEN_ZERO");
        require(address(_oracle) != address(0), "ORACLE_ZERO");
        require(address(_rateModel) != address(0), "MODEL_ZERO");
        aToken = _aToken;
        oracle = _oracle;
        rateModel = _rateModel;
    }

    /* ────────────────────────── errores ─────────────────────────── */
    error AmountZero();
    error TokenZero();
    error InsufficientCollateral();
    error InsufficientDebt();
    error HealthFactorTooLow(); // HF < 1 en withdraw / borrow
    error HealthFactorOk(); // HF ≥ 1 en liquidate

    /* ─────────────────────── datos de reserva ───────────────────── */
    struct ReserveData {
        uint256 totalCollateral;
        uint256 totalDebt;
        uint128 borrowIndex; // RAY
        uint40 lastUpdate;
    }

    mapping(address => ReserveData) private _reserves; // token → reserva
    mapping(address => mapping(address => uint)) private _userCollateral; // token → user → colateral
    mapping(address => mapping(address => uint)) private _userDebt; // token → user → deuda

    /* ───────────────────────── eventos ──────────────────────────── */
    event Deposit(address indexed token, address indexed user, uint256 amount);
    event Withdraw(address indexed token, address indexed user, uint256 amount);
    event Borrow(address indexed token, address indexed user, uint256 amount);
    event Repay(address indexed token, address indexed user, uint256 amount);
    event Liquidate(
        address indexed token,
        address indexed user,
        uint256 repayAmount,
        uint256 collateralSeized
    );
    event EmergencyWithdrawal(address indexed token, uint256 amount);

    /* ───────────────────────── modifiers ────────────────────────── */
    modifier validToken(address token) {
        if (token == address(0)) revert TokenZero();
        _;
    }

    /* ══════════════════════ FUNCIONES DE USUARIO ═════════════════════ */

    function deposit(
        address token,
        uint256 amount
    ) external nonReentrant whenNotPaused validToken(token) {
        if (amount == 0) revert AmountZero();
        _updateReserve(token);

        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
        _reserves[token].totalCollateral += amount;
        _userCollateral[token][msg.sender] += amount;

        aToken.mint(msg.sender, amount);
        emit Deposit(token, msg.sender, amount);
    }

    function withdraw(
        address token,
        uint256 amount
    ) external nonReentrant whenNotPaused validToken(token) {
        if (amount == 0) revert AmountZero();
        _updateReserve(token);

        uint256 coll = _userCollateral[token][msg.sender];
        if (coll < amount) revert InsufficientCollateral();

        // ── comprobar que el HF tras la retirada sigue ≥ 1 ──
        uint256 hfAfter = _healthFactor(
            token,
            coll - amount,
            _userDebt[token][msg.sender]
        );
        if (hfAfter < WAD) revert HealthFactorTooLow();

        _userCollateral[token][msg.sender] = coll - amount;
        _reserves[token].totalCollateral -= amount;

        aToken.burn(msg.sender, amount);
        IERC20(token).safeTransfer(msg.sender, amount);
        emit Withdraw(token, msg.sender, amount);
    }

    function borrow(
        address token,
        uint256 amount
    ) external nonReentrant whenNotPaused validToken(token) {
        if (amount == 0) revert AmountZero();
        _accrueInterest(token);

        uint256 newDebt = _userDebt[token][msg.sender] + amount;

        // ── comprobar HF con la nueva deuda ──
        uint256 hfAfter = _healthFactor(
            token,
            _userCollateral[token][msg.sender],
            newDebt
        );
        if (hfAfter < WAD) revert HealthFactorTooLow();

        _reserves[token].totalDebt += amount;
        _userDebt[token][msg.sender] = newDebt;

        IERC20(token).safeTransfer(msg.sender, amount);
        emit Borrow(token, msg.sender, amount);
    }

    function repay(
        address token,
        uint256 amount
    ) external nonReentrant whenNotPaused validToken(token) {
        if (amount == 0) revert AmountZero();
        _accrueInterest(token);

        uint256 debt = _userDebt[token][msg.sender];
        if (debt < amount) revert InsufficientDebt();

        _userDebt[token][msg.sender] = debt - amount;
        _reserves[token].totalDebt -= amount;

        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
        emit Repay(token, msg.sender, amount);
    }

    function liquidate(
        address token,
        address user,
        uint256 repayAmount
    ) external nonReentrant whenNotPaused validToken(token) {
        _accrueInterest(token);

        if (
            _healthFactor(
                token,
                _userCollateral[token][user],
                _userDebt[token][user]
            ) >= WAD
        ) revert HealthFactorOk();

        uint256 userDebt = _userDebt[token][user];
        if (repayAmount == 0 || repayAmount > userDebt)
            revert InsufficientDebt();

        IERC20(token).safeTransferFrom(msg.sender, address(this), repayAmount);

        _userDebt[token][user] = userDebt - repayAmount;
        _reserves[token].totalDebt -= repayAmount;

        uint256 seize = (repayAmount * LIQ_BONUS_WAD) / WAD;
        uint256 userColl = _userCollateral[token][user];
        if (seize > userColl) seize = userColl;

        _userCollateral[token][user] = userColl - seize;
        _reserves[token].totalCollateral -= seize;

        IERC20(token).safeTransfer(msg.sender, seize);
        emit Liquidate(token, user, repayAmount, seize);
    }

    /* ══════════════════════ VISTAS PÚBLICAS ═════════════════════ */

    function getReserveData(
        address token
    ) external view returns (ReserveData memory) {
        return _reserves[token];
    }

    /// Cantidad de colateral que un usuario tiene depositada para un token
    function getUserCollateral(
        address token,
        address user
    ) external view returns (uint256) {
        return _userCollateral[token][user];
    }

    /// Cantidad de deuda que un usuario tiene para un token
    function getUserDebt(
        address token,
        address user
    ) external view returns (uint256) {
        return _userDebt[token][user];
    }

    /// Health-Factor (WAD). ∞ si no hay deuda
    function getHealthFactor(
        address token,
        address user
    ) external view returns (uint256) {
        return
            _healthFactor(
                token,
                _userCollateral[token][user],
                _userDebt[token][user]
            );
    }

    /* ══════════════════════ ADMIN / GUARD ══════════════════════ */

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function emergencyWithdraw(
        address token
    ) external onlyOwner whenPaused validToken(token) {
        uint256 bal = IERC20(token).balanceOf(address(this));
        IERC20(token).safeTransfer(msg.sender, bal);
        emit EmergencyWithdrawal(token, bal);
    }

    /* ══════════════════════ INTERNAS ══════════════════════════ */

    function _updateReserve(address token) internal {
        ReserveData storage r = _reserves[token];
        if (r.borrowIndex == 0) r.borrowIndex = uint128(RAY);
        if (r.lastUpdate == 0) r.lastUpdate = uint40(block.timestamp);
    }

    function _accrueInterest(address token) internal {
        ReserveData storage r = _reserves[token];

        uint40 nowTs = uint40(block.timestamp);
        uint40 dt = nowTs - r.lastUpdate;
        if (dt == 0) return;

        uint256 util = r.totalCollateral == 0
            ? RAY
            : (r.totalDebt * RAY) / r.totalCollateral;
        uint256 rate = rateModel.getBorrowRate(util); // RAY/seg

        r.borrowIndex = uint128(
            (rate * dt * r.borrowIndex) / RAY + r.borrowIndex
        );
        r.lastUpdate = nowTs;
    }

    /// cálculo interno reutilizable
    function _healthFactor(
        address token,
        uint256 collateral,
        uint256 debt
    ) internal view returns (uint256) {
        if (debt == 0) return type(uint256).max;

        (uint256 price, uint8 pDec) = oracle.getPrice(token);

        uint256 collUsd = (collateral * price) / 10 ** pDec;
        uint256 debtUsd = (debt * price) / 10 ** pDec;

        // HF = (collUsd / debtUsd) / maxLTV
        return (collUsd * WAD) / ((debtUsd * WAD) / MAX_LTV_WAD);
    }
}
