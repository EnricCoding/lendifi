// test/LendingPool.pause.ts
// SPDX-License-Identifier: MIT
import { ethers } from "hardhat";
import { expect } from "chai";
import { Contract } from "ethers";

describe("LendingPool – pause / unpause", () => {
  let pool: Contract;
  let token: Contract;
  let aToken: Contract;
  let owner: any;
  let alice: any;

  const ONE = ethers.utils.parseEther("1");

  beforeEach(async () => {
    [owner, alice] = await ethers.getSigners();

    /* 1️. TestToken */
    const Token = await ethers.getContractFactory("TestToken");
    token = await Token.deploy();
    await token.mint(alice.address, ONE.mul(100));

    /* 2️. AToken */
    const AToken = await ethers.getContractFactory("AToken");
    aToken = await AToken.deploy("LendiFi aToken", "aLEND");

    /* 3️. mocks for oracle and interest model */
    const MockOracle = await ethers.getContractFactory("MockOracle");
    const oracle = await MockOracle.deploy();
    const MockModel = await ethers.getContractFactory("MockInterestRateModel");
    const rateModel = await MockModel.deploy();

    /* 4️. LendingPool */
    const Pool = await ethers.getContractFactory("LendingPool");
    pool = await Pool.deploy(aToken.address, oracle.address, rateModel.address);

    /* Pool becomes owner of aToken to mint/burn */
    await aToken.transferOwnership(pool.address);

    /* Alice approves pool */
    await token
      .connect(alice)
      .approve(pool.address, ethers.constants.MaxUint256);
  });

  it("pauses and blocks deposit / withdraw", async () => {
    await pool.connect(owner).pause();

    await expect(
      pool.connect(alice).deposit(token.address, ONE)
    ).to.be.revertedWith("EnforcedPause");

    await expect(
      pool.connect(alice).withdraw(token.address, ONE)
    ).to.be.revertedWith("EnforcedPause");
  });

  it("unpauses and allows operations again", async () => {
    await pool.connect(owner).pause();
    await pool.connect(owner).unpause();

    await pool.connect(alice).deposit(token.address, ONE);
    await pool.connect(alice).withdraw(token.address, ONE);

    const col = await pool.getUserCollateral(token.address, alice.address);
    expect(col).to.equal(0);
  });

  it("only owner can pause/unpause", async () => {
    await expect(pool.connect(alice).pause()).to.be.revertedWith(
      "OwnableUnauthorizedAccount"
    );
  });
});
