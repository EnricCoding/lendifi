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

  it("debe exponer nombre y símbolo correctos", async () => {
    expect(await aToken.name()).to.equal(NAME);
    expect(await aToken.symbol()).to.equal(SYMBOL);
  });

  it("comienza con suministro total 0", async () => {
    expect(await aToken.totalSupply()).to.equal(0);
  });

  it("el owner puede mintear tokens", async () => {
    await expect(aToken.connect(owner).mint(alice.address, AMOUNT))
      .to.emit(aToken, "Transfer")
      .withArgs(ethers.constants.AddressZero, alice.address, AMOUNT);

    expect(await aToken.totalSupply()).to.equal(AMOUNT);
    expect(await aToken.balanceOf(alice.address)).to.equal(AMOUNT);
  });

  it("no-owner no puede mintear", async () => {
    await expect(
      aToken.connect(bob).mint(bob.address, AMOUNT)
    ).to.be.revertedWith("OwnableUnauthorizedAccount");
  });

  it("el owner puede quemar tokens", async () => {
    // Primero mint a alice
    await aToken.connect(owner).mint(alice.address, AMOUNT);

    // owner quema 400 de alice
    const BURN = ethers.utils.parseEther("400");
    await expect(aToken.connect(owner).burn(alice.address, BURN))
      .to.emit(aToken, "Transfer")
      .withArgs(alice.address, ethers.constants.AddressZero, BURN);

    expect(await aToken.totalSupply()).to.equal(AMOUNT.sub(BURN));
    expect(await aToken.balanceOf(alice.address)).to.equal(AMOUNT.sub(BURN));
  });

  it("no-owner no puede quemar", async () => {
    // owner miente a alice
    await aToken.connect(owner).mint(alice.address, AMOUNT);

    // bob intenta quemar
    await expect(
      aToken.connect(bob).burn(alice.address, ethers.utils.parseEther("1"))
    ).to.be.revertedWith("OwnableUnauthorizedAccount");
  });

  it("soporta transferencias ERC20 estándar", async () => {
    // mint a alice
    await aToken.connect(owner).mint(alice.address, AMOUNT);

    // alice transfiere 200 a bob
    const XFER = ethers.utils.parseEther("200");
    await expect(aToken.connect(alice).transfer(bob.address, XFER))
      .to.emit(aToken, "Transfer")
      .withArgs(alice.address, bob.address, XFER);

    expect(await aToken.balanceOf(alice.address)).to.equal(AMOUNT.sub(XFER));
    expect(await aToken.balanceOf(bob.address)).to.equal(XFER);
  });

  it("soporta allowance + transferFrom", async () => {
    await aToken.connect(owner).mint(alice.address, AMOUNT);

    // alice aprueba a bob
    const ALLOW = ethers.utils.parseEther("300");
    await aToken.connect(alice).approve(bob.address, ALLOW);
    expect(await aToken.allowance(alice.address, bob.address)).to.equal(ALLOW);

    // bob gasta 150 en nombre de alice
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
