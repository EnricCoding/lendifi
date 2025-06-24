// SPDX-License-Identifier: MIT
import { ethers } from "hardhat";
import { expect } from "chai";
import { Contract, BigNumber } from "ethers";

describe("LendingPool – deposit & withdraw (con aToken)", () => {
  let pool: Contract;
  let token: Contract;
  let aToken: Contract;
  let user: any;

  const ONE = ethers.utils.parseEther("1");

  beforeEach(async () => {
    /* signers */
    const [deployer, alice] = await ethers.getSigners();
    user = alice;

    /* 1️⃣ TestToken */
    const Token = await ethers.getContractFactory("TestToken");
    token = await Token.deploy();
    await token.mint(user.address, ONE.mul(1_000));

    /* 2️⃣ AToken */
    const AToken = await ethers.getContractFactory("AToken");
    aToken = await AToken.deploy("LendiFi aToken", "aLEND");

    /* 3️⃣ mocks para oracle y modelo de interés (devuelven 1 USD y 0% APR) */
    const MockOracle = await ethers.getContractFactory("MockOracle");
    const oracle = await MockOracle.deploy();
    const MockModel = await ethers.getContractFactory("MockInterestRateModel");
    const rateModel = await MockModel.deploy();

    /* 4️⃣ LendingPool */
    const Pool = await ethers.getContractFactory("LendingPool");
    pool = await Pool.deploy(aToken.address, oracle.address, rateModel.address);

    /* El pool necesita ser owner del aToken para mintear/quemar */
    await aToken.transferOwnership(pool.address);

    /* approve */
    await token
      .connect(user)
      .approve(pool.address, ethers.constants.MaxUint256);
  });

  it("depositar y retirar correctamente e interactuar con aToken", async () => {
    const amt = ONE.mul(500);

    /* saldo aToken inicial */
    expect(await aToken.balanceOf(user.address)).to.equal(0);

    /* ─ deposit ─ */
    await expect(pool.connect(user).deposit(token.address, amt))
      .to.emit(pool, "Deposit")
      .withArgs(token.address, user.address, amt);

    expect(await aToken.balanceOf(user.address)).to.equal(amt);

    /* ─ withdraw ─ */
    await expect(pool.connect(user).withdraw(token.address, amt))
      .to.emit(pool, "Withdraw")
      .withArgs(token.address, user.address, amt);

    expect(await aToken.balanceOf(user.address)).to.equal(0);

    const col: BigNumber = await pool.getUserCollateral(
      token.address,
      user.address
    );
    expect(col).to.equal(0);
  });

  it("revertir si amount = 0", async () => {
    await expect(
      pool.connect(user).deposit(token.address, 0)
    ).to.be.revertedWith("AmountZero");
  });

  it("revertir si retira más de su colateral", async () => {
    await expect(
      pool.connect(user).withdraw(token.address, 1)
    ).to.be.revertedWith("InsufficientCollateral");
  });
});
