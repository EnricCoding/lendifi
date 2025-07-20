// SPDX-License-Identifier: MIT
import { ethers } from "hardhat";
import { expect } from "chai";
import { Contract } from "ethers";

describe("LendingPool – emergencyWithdraw", () => {
  let pool: Contract;
  let token: Contract;
  let aToken: Contract;
  let owner: any;
  let alice: any;

  const FIFTY = ethers.utils.parseEther("50");

  beforeEach(async () => {
    [owner, alice] = await ethers.getSigners();

    /* 1️. TestToken */
    const Token = await ethers.getContractFactory("TestToken");
    token = await Token.deploy();

    /* 2️. AToken */
    const AToken = await ethers.getContractFactory("AToken");
    aToken = await AToken.deploy("LendiFi aToken", "aLEND");

    /* 3️. mocks: oracle and interest model */
    const MockOracle = await ethers.getContractFactory("MockOracle");
    const oracle = await MockOracle.deploy();
    const MockRate = await ethers.getContractFactory("MockInterestRateModel");
    const rateModel = await MockRate.deploy();

    /* 4️. LendingPool */
    const Pool = await ethers.getContractFactory("LendingPool");
    pool = await Pool.deploy(aToken.address, oracle.address, rateModel.address);

    /* Pool becomes owner of aToken */
    await aToken.transferOwnership(pool.address);

    /* Simulate liquidity: mint 50 tokens to the pool */
    await token.mint(pool.address, FIFTY);
  });

  it("allows the owner to rescue funds when paused", async () => {
    const before = await token.balanceOf(owner.address);

    await pool.connect(owner).pause();

    await expect(pool.connect(owner).emergencyWithdraw(token.address))
      .to.emit(pool, "EmergencyWithdrawal")
      .withArgs(token.address, FIFTY);

    const after = await token.balanceOf(owner.address);
    expect(after.sub(before)).to.equal(FIFTY);
  });

  it("reverts if the pool is NOT paused", async () => {
    await expect(
      pool.connect(owner).emergencyWithdraw(token.address)
    ).to.be.revertedWith("ExpectedPause");
  });

  it("reverts if non-owner tries to rescue funds", async () => {
    await pool.connect(owner).pause();
    await expect(
      pool.connect(alice).emergencyWithdraw(token.address)
    ).to.be.revertedWith("OwnableUnauthorizedAccount");
  });
});
