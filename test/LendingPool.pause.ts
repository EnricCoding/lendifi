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

    /* 1️⃣ TestToken */
    const Token = await ethers.getContractFactory("TestToken");
    token = await Token.deploy();
    await token.mint(alice.address, ONE.mul(100));

    /* 2️⃣ AToken */
    const AToken = await ethers.getContractFactory("AToken");
    aToken = await AToken.deploy("LendiFi aToken", "aLEND");

    /* 3️⃣ mocks para oracle y modelo de interés */
    const MockOracle = await ethers.getContractFactory("MockOracle");
    const oracle = await MockOracle.deploy();
    const MockModel = await ethers.getContractFactory("MockInterestRateModel");
    const rateModel = await MockModel.deploy();

    /* 4️⃣ LendingPool */
    const Pool = await ethers.getContractFactory("LendingPool");
    pool = await Pool.deploy(aToken.address, oracle.address, rateModel.address);

    /* El pool se hace owner del aToken para poder mint/burn */
    await aToken.transferOwnership(pool.address);

    /* approval de Alice */
    await token
      .connect(alice)
      .approve(pool.address, ethers.constants.MaxUint256);
  });

  it("pausa y bloquea deposit / withdraw", async () => {
    await pool.connect(owner).pause();

    await expect(
      pool.connect(alice).deposit(token.address, ONE)
    ).to.be.revertedWith("EnforcedPause");

    await expect(
      pool.connect(alice).withdraw(token.address, ONE)
    ).to.be.revertedWith("EnforcedPause");
  });

  it("unpausa y permite operaciones otra vez", async () => {
    await pool.connect(owner).pause();
    await pool.connect(owner).unpause();

    await pool.connect(alice).deposit(token.address, ONE);
    await pool.connect(alice).withdraw(token.address, ONE);

    const col = await pool.getUserCollateral(token.address, alice.address);
    expect(col).to.equal(0);
  });

  it("solo owner puede pausar/despausar", async () => {
    await expect(pool.connect(alice).pause())
      .to.be.revertedWith("OwnableUnauthorizedAccount")
      .withArgs(alice.address);
  });
});
