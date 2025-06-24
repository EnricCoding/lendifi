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

  // Convierte APR (%) a tasa por segundo en RAY
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

  it("inicializa los parámetros correctamente", async () => {
    const onChain = await model.params();
    expect(onChain.baseRate).to.equal(params.baseRate);
    expect(onChain.slope1).to.equal(params.slope1);
    expect(onChain.slope2).to.equal(params.slope2);
    expect(onChain.optimal).to.equal(params.optimal);
  });

  it("revertir si optimal inválido", async () => {
    const bad = { ...params, optimal: WAD };
    await expect(model.updateParams(bad)).to.be.revertedWith("BAD_OPTIMAL");
  });

  it("getBorrowRate en puntos clave", async () => {
    const rate0 = await model.getBorrowRate(ethers.constants.Zero);
    const rateOpt = await model.getBorrowRate(params.optimal);
    const rate100 = await model.getBorrowRate(WAD);

    expect(rate0).to.equal(params.baseRate);
    expect(rateOpt).to.equal(params.baseRate.add(params.slope1));
    expect(rate100).to.equal(
      params.baseRate.add(params.slope1).add(params.slope2)
    );

    // Monotonía
    const rateMid = await model.getBorrowRate(WAD.div(2));
    expect(rateMid).to.be.gt(rate0);
    expect(rateMid).to.be.lt(rateOpt);
    const ratePost = await model.getBorrowRate(WAD.mul(90).div(100));
    expect(ratePost).to.be.gt(rateOpt);
    expect(ratePost).to.be.lt(rate100);
  });

  it("getDepositRate combina borrowRate, U y reserveFactor", async () => {
    const u = WAD.div(2); // 50%
    const rf = WAD.mul(10).div(100); // 10%

    const borrowRate = await model.getBorrowRate(u);
    const depositRate = await model.getDepositRate(u, rf);

    // debe ser menor que borrowRate y mayor que zero
    expect(depositRate).to.be.lt(borrowRate);
    expect(depositRate).to.be.gt(ethers.constants.Zero);
  });

  it("solo owner puede actualizar parámetros", async () => {
    await expect(model.connect(alice).updateParams(params))
      .to.be.revertedWith("OwnableUnauthorizedAccount");
  });

  it("updateParams emite evento ParamsUpdated", async () => {
    const newP = { ...params, baseRate: aprToRaySec(3) };
    await expect(model.updateParams(newP))
      .to.emit(model, "ParamsUpdated")
      .withArgs(newP);
  });
});
