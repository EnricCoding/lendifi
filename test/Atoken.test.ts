// test/AToken.test.ts
// SPDX-License-Identifier: MIT
import { ethers } from "hardhat";
import { expect } from "chai";
import { Contract } from "ethers";

describe("AToken", () => {
  let aToken: Contract;
  let owner: any;
  let alice: any;
  let bob: any;

  const NAME = "LendiFi aToken";
  const SYMBOL = "aLEND";
  const AMOUNT = ethers.utils.parseEther("1000");

  beforeEach(async () => {
    [owner, alice, bob] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("AToken");
    aToken = await Factory.deploy(NAME, SYMBOL);
    await aToken.deployed();
  });

  it("should expose the correct name and symbol", async () => {
    expect(await aToken.name()).to.equal(NAME);
    expect(await aToken.symbol()).to.equal(SYMBOL);
  });

  it("starts with total supply 0", async () => {
    expect(await aToken.totalSupply()).to.equal(0);
  });

  it("allows the owner to mint tokens", async () => {
    await expect(aToken.connect(owner).mint(alice.address, AMOUNT))
      .to.emit(aToken, "Transfer")
      .withArgs(ethers.constants.AddressZero, alice.address, AMOUNT);

    expect(await aToken.totalSupply()).to.equal(AMOUNT);
    expect(await aToken.balanceOf(alice.address)).to.equal(AMOUNT);
  });

  it("prevents non-owners from minting", async () => {
    await expect(
      aToken.connect(bob).mint(bob.address, AMOUNT)
    ).to.be.revertedWith("OwnableUnauthorizedAccount");
  });

  it("allows the owner to burn tokens", async () => {
    // First mint to alice
    await aToken.connect(owner).mint(alice.address, AMOUNT);

    // owner burns 400 from alice
    const BURN = ethers.utils.parseEther("400");
    await expect(aToken.connect(owner).burn(alice.address, BURN))
      .to.emit(aToken, "Transfer")
      .withArgs(alice.address, ethers.constants.AddressZero, BURN);

    expect(await aToken.totalSupply()).to.equal(AMOUNT.sub(BURN));
    expect(await aToken.balanceOf(alice.address)).to.equal(AMOUNT.sub(BURN));
  });

  it("prevents non-owners from burning", async () => {
    // owner mints to alice
    await aToken.connect(owner).mint(alice.address, AMOUNT);

    // bob attempts to burn
    await expect(
      aToken.connect(bob).burn(alice.address, ethers.utils.parseEther("1"))
    ).to.be.revertedWith("OwnableUnauthorizedAccount");
  });

  it("supports standard ERC20 transfers", async () => {
    // mint to alice
    await aToken.connect(owner).mint(alice.address, AMOUNT);

    // alice transfers 200 to bob
    const XFER = ethers.utils.parseEther("200");
    await expect(aToken.connect(alice).transfer(bob.address, XFER))
      .to.emit(aToken, "Transfer")
      .withArgs(alice.address, bob.address, XFER);

    expect(await aToken.balanceOf(alice.address)).to.equal(AMOUNT.sub(XFER));
    expect(await aToken.balanceOf(bob.address)).to.equal(XFER);
  });

  it("supports allowance + transferFrom", async () => {
    await aToken.connect(owner).mint(alice.address, AMOUNT);

    // alice approves bob
    const ALLOW = ethers.utils.parseEther("300");
    await aToken.connect(alice).approve(bob.address, ALLOW);
    expect(await aToken.allowance(alice.address, bob.address)).to.equal(ALLOW);

    // bob spends 150 on behalf of alice
    const SPEND = ethers.utils.parseEther("150");
    await expect(
      aToken.connect(bob).transferFrom(alice.address, bob.address, SPEND)
    )
      .to.emit(aToken, "Transfer")
      .withArgs(alice.address, bob.address, SPEND);

    expect(await aToken.balanceOf(bob.address)).to.equal(SPEND);
    expect(await aToken.allowance(alice.address, bob.address)).to.equal(
      ALLOW.sub(SPEND)
    );
  });
});
