import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  const TestToken = await ethers.getContractFactory("TestToken");
  const token = await TestToken.deploy();
  await token.deployed();
  console.log("TestToken deployed at:", token.address);
}

main().catch(console.error);
