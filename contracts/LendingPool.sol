// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/**
 * @title LendingPool (LendiFi v0.3)
 * @notice Añade préstamos (borrow), devoluciones (repay) y liquidaciones (liquidate).
 */

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "./AToken.sol";
import "./PriceOracle.sol";
import "./InterestRateModel.sol";

contract LendingPool is ReentrancyGuard, Pausable, Ownable {
    using SafeERC20 for IERC20;
    uint256 private constant RAY = 1e27;

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

    /* ───────────────────────────── Errores ─────────────────────────────── */
    error AmountZero();
    error TokenZero();
    error InsufficientCollateral();
    error InsufficientDebt();
    error HealthFactorOk();

    /* ──────────────────────── Datos de la reserva ──────────────────────── */
    struct ReserveData {
        uint256 totalCollateral;
        uint256 totalDebt;
        uint128 borrowIndex; // en RAY
        uint40 lastUpdate;
    }

    mapping(address => ReserveData) private _reserves; // token → reserva
    mapping(address => mapping(address => uint256)) private _userCollateral; // token → user → colateral
    mapping(address => mapping(address => uint256)) private _userDebt; // token → user → deuda

    /* ───────────────────────────── Eventos ─────────────────────────────── */
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

    /* ─────────────────────────── Modificador ───────────────────────────── */
    modifier validToken(address token) {
        if (token == address(0)) revert TokenZero();
        _;
    }

    /* ────────────────────── Funciones de usuario ───────────────────────── */

    /// Depósito de colateral (mina aTokens 1:1)
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

    /// Retirada de colateral (quema aTokens)
    function withdraw(
        address token,
        uint256 amount
    ) external nonReentrant whenNotPaused validToken(token) {
        if (amount == 0) revert AmountZero();
        _updateReserve(token);

        uint256 coll = _userCollateral[token][msg.sender];
        if (coll < amount) revert InsufficientCollateral();

        _userCollateral[token][msg.sender] = coll - amount;
        _reserves[token].totalCollateral -= amount;

        aToken.burn(msg.sender, amount);
        IERC20(token).safeTransfer(msg.sender, amount);
        emit Withdraw(token, msg.sender, amount);
    }

    /// Solicita préstamo
    function borrow(
        address token,
        uint256 amount
    ) external nonReentrant whenNotPaused validToken(token) {
        if (amount == 0) revert AmountZero();
        _accrueInterest(token);

        // TODO: comprobar LTV / healthFactor antes de permitir borrow
        _reserves[token].totalDebt += amount;
        _userDebt[token][msg.sender] += amount;

        IERC20(token).safeTransfer(msg.sender, amount);
        emit Borrow(token, msg.sender, amount);
    }

    /// Devuelve deuda
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

    /// Liquidación simplificada
    function liquidate(
        address token,
        address user,
        uint256 repayAmount
    ) external nonReentrant whenNotPaused validToken(token) {
        _accrueInterest(token);
        // TODO: comprobar healthFactor < 1
        _reserves[token].totalDebt -= repayAmount;
        _userDebt[token][user] -= repayAmount;

        IERC20(token).safeTransferFrom(msg.sender, address(this), repayAmount);

        uint256 seize = repayAmount; // simplificado 1:1
        _userCollateral[token][user] -= seize;
        _reserves[token].totalCollateral -= seize;

        IERC20(token).safeTransfer(msg.sender, seize);
        emit Liquidate(token, user, repayAmount, seize);
    }

    /* ───────────────────────── Vistas públicas ─────────────────────────── */

    function getUserCollateral(
        address token,
        address user
    ) external view returns (uint256) {
        return _userCollateral[token][user];
    }

    function getUserDebt(
        address token,
        address user
    ) external view returns (uint256) {
        return _userDebt[token][user];
    }

    function getReserveData(
        address token
    ) external view returns (ReserveData memory) {
        return _reserves[token];
    }

    /* ──────────────────────── Administración ───────────────────────────── */

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

    /* ───────────────────────── Funciones internas ──────────────────────── */

    /// Inicializa índices si es la primera interacción con el token
    function _updateReserve(address token) internal {
        ReserveData storage r = _reserves[token];
        if (r.borrowIndex == 0) r.borrowIndex = uint128(RAY);
        if (r.lastUpdate == 0) r.lastUpdate = uint40(block.timestamp);
    }

    /// Devenga intereses sobre la deuda pendiente
    function _accrueInterest(address token) internal {
        ReserveData storage r = _reserves[token];

        uint40 nowTs = uint40(block.timestamp);
        uint40 dt = nowTs - r.lastUpdate;
        if (dt == 0) return;

        // Utilización protegida contra división por 0
        uint256 util = r.totalCollateral == 0
            ? RAY // 100 %
            : (r.totalDebt * RAY) / r.totalCollateral;

        uint256 rate = rateModel.getBorrowRate(util); // en RAY/segundo

        uint256 newIndex = (rate * dt * r.borrowIndex) / RAY + r.borrowIndex;
        r.borrowIndex = uint128(newIndex);
        r.lastUpdate = nowTs;
    }
}
