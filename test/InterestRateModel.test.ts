// SPDX-License-Identifier: MIT
import { ethers } from "hardhat";
import { expect } from "chai";
import { Contract } from "ethers";

describe("InterestRateModel", () => {
  let model: Contract;
  let owner: any;
  let alice: any;

  const WAD = ethers.constants.WeiPerEther; // 1e18
  const RAY = ethers.BigNumber.from("1000000000000000000000000000"); // 1e27

  // Convert APR (%) to rate per second in RAY
  const secsPerYear = ethers.BigNumber.from(365 * 24 * 3600);
  const aprToRaySec = (aprPct: number) =>
    ethers.BigNumber.from(aprPct).mul(RAY).div(100).div(secsPerYear);

  const params = {
    baseRate: aprToRaySec(2),
    slope1: aprToRaySec(10),
    slope2: aprToRaySec(100),
    optimal: WAD.mul(80).div(100),
  };

  beforeEach(async () => {
    [owner, alice] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("InterestRateModel");
    model = await Factory.deploy(params);
    await model.deployed();
  });

  it("initializes parameters correctly", async () => {
    const onChain = await model.params();
    expect(onChain.baseRate).to.equal(params.baseRate);
    expect(onChain.slope1).to.equal(params.slope1);
    expect(onChain.slope2).to.equal(params.slope2);
    expect(onChain.optimal).to.equal(params.optimal);
  });

  it("reverts when optimal is invalid", async () => {
    const bad = { ...params, optimal: WAD };
    await expect(model.updateParams(bad)).to.be.revertedWith("BAD_OPTIMAL");
  });

  it("getBorrowRate at key points", async () => {
    const rate0 = await model.getBorrowRate(ethers.constants.Zero);
    const rateOpt = await model.getBorrowRate(params.optimal);
    const rate100 = await model.getBorrowRate(WAD);

    expect(rate0).to.equal(params.baseRate);
    expect(rateOpt).to.equal(params.baseRate.add(params.slope1));
    expect(rate100).to.equal(
      params.baseRate.add(params.slope1).add(params.slope2)
    );

    // Monotonicity
    const rateMid = await model.getBorrowRate(WAD.div(2));
    expect(rateMid).to.be.gt(rate0);
    expect(rateMid).to.be.lt(rateOpt);
    const ratePost = await model.getBorrowRate(WAD.mul(90).div(100));
    expect(ratePost).to.be.gt(rateOpt);
    expect(ratePost).to.be.lt(rate100);
  });

  it("getDepositRate combines borrowRate, utilization, and reserveFactor", async () => {
    const u = WAD.div(2); // 50%
    const rf = WAD.mul(10).div(100); // 10%

    const borrowRate = await model.getBorrowRate(u);
    const depositRate = await model.getDepositRate(u, rf);

    // should be less than borrowRate and greater than zero
    expect(depositRate).to.be.lt(borrowRate);
    expect(depositRate).to.be.gt(ethers.constants.Zero);
  });

  it("only owner can update parameters", async () => {
    await expect(model.connect(alice).updateParams(params)).to.be.revertedWith(
      "OwnableUnauthorizedAccount"
    );
  });

  it("updateParams emits ParamsUpdated event", async () => {
    const newP = { ...params, baseRate: aprToRaySec(3) };
    await expect(model.updateParams(newP))
      .to.emit(model, "ParamsUpdated")
      .withArgs(newP);
  });
});
