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

    const Feed = await ethers.getContractFactory("MockAggregator");
    feed = await Feed.deploy(8);
    await feed.setAnswer(TWO_K);

    await oracle.setFeed(TOKEN1, feed.address);
  });

  it("returns correct price and decimals", async () => {
    const [price, dec] = await oracle.getPrice(TOKEN1);
    expect(price).to.equal(TWO_K);
    expect(dec).to.equal(8);
  });

  it("reverts if no feed is set", async () => {
    await expect(
      oracle.getPrice(ethers.constants.AddressZero)
    ).to.be.revertedWith("FEED_NOT_SET");
  });

  it("reverts on invalid price", async () => {
    await feed.setAnswer(0);
    await expect(oracle.getPrice(TOKEN1)).to.be.revertedWith("INVALID_PRICE");
  });

  it("reverts when paused", async () => {
    await oracle.pause();
    await expect(oracle.getPrice(TOKEN1)).to.be.revertedWith("EnforcedPause");
  });

  it("only owner can register a feed", async () => {
    await expect(
      oracle.connect(alice).setFeed(TOKEN1, feed.address)
    ).to.be.revertedWith("OwnableUnauthorizedAccount");
  });
});
