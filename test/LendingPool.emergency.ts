// test/LendingPool.emergency.ts
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

    /* 1️⃣ TestToken */
    const Token = await ethers.getContractFactory("TestToken");
    token = await Token.deploy();

    /* 2️⃣ AToken */
    const AToken = await ethers.getContractFactory("AToken");
    aToken = await AToken.deploy("LendiFi aToken", "aLEND");

    /* 3️⃣ mocks: oracle y modelo de interés */
    const MockOracle = await ethers.getContractFactory("MockOracle");
    const oracle = await MockOracle.deploy();
    const MockRate = await ethers.getContractFactory("MockInterestRateModel");
    const rateModel = await MockRate.deploy();

    /* 4️⃣ LendingPool */
    const Pool = await ethers.getContractFactory("LendingPool");
    pool = await Pool.deploy(aToken.address, oracle.address, rateModel.address);

    /* El pool pasa a ser owner del aToken */
    await aToken.transferOwnership(pool.address);

    /* Simulamos liquidez: enviamos 50 tokens al pool */
    await token.mint(pool.address, FIFTY);
  });

  it("permite al owner rescatar fondos cuando está pausado", async () => {
    const before = await token.balanceOf(owner.address);

    await pool.connect(owner).pause();

    await expect(pool.connect(owner).emergencyWithdraw(token.address))
      .to.emit(pool, "EmergencyWithdrawal")
      .withArgs(token.address, FIFTY);

    const after = await token.balanceOf(owner.address);
    expect(after.sub(before)).to.equal(FIFTY);
  });

  it("revierta si el pool NO está pausado", async () => {
    await expect(
      pool.connect(owner).emergencyWithdraw(token.address)
    ).to.be.revertedWith("ExpectedPause");
  });

  it("revierta si alguien que no es owner intenta rescatar", async () => {
    await pool.connect(owner).pause();
    await expect(
      pool.connect(alice).emergencyWithdraw(token.address)
    ).to.be.revertedWith("OwnableUnauthorizedAccount");
  });
});
