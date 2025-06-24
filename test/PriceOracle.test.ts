// SPDX-License-Identifier: MIT
import { ethers } from "hardhat";
import { expect } from "chai";
import { Contract } from "ethers";

describe("PriceOracle", () => {
  let oracle: Contract;
  let feed: Contract;
  let owner: any;
  let alice: any;

  const TOKEN1 = "0x0000000000000000000000000000000000000001";
  const TWO_K = 2_000_00000000;

  beforeEach(async () => {
    [owner, alice] = await ethers.getSigners();

    oracle = await (await ethers.getContractFactory("PriceOracle")).deploy();

    // despliega MockAggregator con 8 decimales
    const Feed = await ethers.getContractFactory("MockAggregator");
    feed = await Feed.deploy(8);
    await feed.setAnswer(TWO_K);

    await oracle.setFeed(TOKEN1, feed.address);
  });

  it("devuelve precio y decimales correctos", async () => {
    const [price, dec] = await oracle.getPrice(TOKEN1);
    expect(price).to.equal(TWO_K);
    expect(dec).to.equal(8);
  });

  it("revierta si no hay feed", async () => {
    await expect(
      oracle.getPrice(ethers.constants.AddressZero)
    ).to.be.revertedWith("FEED_NOT_SET");
  });

  it("revierta con precio inválido", async () => {
    await feed.setAnswer(0);
    await expect(oracle.getPrice(TOKEN1)).to.be.revertedWith("INVALID_PRICE");
  });

  it("revierta si está pausado", async () => {
    await oracle.pause();
    await expect(oracle.getPrice(TOKEN1)).to.be.revertedWith("EnforcedPause");
  });

  it("solo owner puede registrar feed", async () => {
    await expect(
      oracle.connect(alice).setFeed(TOKEN1, feed.address)
    ).to.be.revertedWith("OwnableUnauthorizedAccount");
  });
});
