import { ethers } from "hardhat";
import { BigNumber } from "ethers";

// direcciones de tus tokens y sus Chainlink‐feed en Sepolia:
const USDC = "0x07865c6e87b9f70255377e024ace6630c1eaa37f";
const USDC_FEED = "0xA39434A63A52E749F02807ae27335515BA4b07F7";

const DAI = "0xad6d458402f60fd3bd25163575031acdce07538d";
const DAI_FEED = "0x2bA49Aaa16E6afD2a993473cfB70Fa8559B523cF";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with:", deployer.address);

  // 1) AToken
  const AToken = await ethers.getContractFactory("AToken");
  const aToken = await AToken.deploy("LendiFi aToken", "aLEND");
  await aToken.deployed();
  console.log("AToken:", aToken.address);

  // 2) PriceOracle
  const Oracle = await ethers.getContractFactory("PriceOracle");
  const oracle = await Oracle.deploy();
  await oracle.deployed();
  console.log("PriceOracle:", oracle.address);

  // Registrar feeds reales
  await (await oracle.setFeed(USDC, USDC_FEED)).wait();
  console.log("Feed USDC/USD set");
  await (await oracle.setFeed(DAI, DAI_FEED)).wait();
  console.log("Feed DAI/USD set");

  // 3) InterestRateModel
  const secsPerYear = BigNumber.from(365 * 24 * 3600);
  const RAY = BigNumber.from("1000000000000000000000000000"); // 1e27

  function aprToRaySec(aprPercent: number): BigNumber {
    // (aprPercent / 100) * RAY / secsPerYear
    return RAY.mul(aprPercent).div(100).div(secsPerYear);
  }

  const modelParams = {
    baseRate: aprToRaySec(2), // 0.02 APR
    slope1: aprToRaySec(10), // 0.10 APR
    slope2: aprToRaySec(100), // 1.00 APR
    optimal: BigNumber.from("800000000000000000"), // 0.8 WAD
  };

  const Model = await ethers.getContractFactory("InterestRateModel");
  const rateModel = await Model.deploy(modelParams);
  await rateModel.deployed();
  console.log("InterestRateModel:", rateModel.address);

  // 4) LendingPool
  const Pool = await ethers.getContractFactory("LendingPool");
  const pool = await Pool.deploy(
    aToken.address,
    oracle.address,
    rateModel.address
  );
  await pool.deployed();
  console.log("LendingPool:", pool.address);

  // 5) Cede la propiedad de aToken al pool
  await (await aToken.transferOwnership(pool.address)).wait();
  console.log("aToken owner set to LendingPool");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
