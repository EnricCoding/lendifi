import { ethers } from "hardhat";
import { BigNumber } from "ethers";

// ───── Tokens en Sepolia ─────
const USDC = "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238"; // USDC en Sepolia :contentReference[oaicite:0]{index=0}
const DAI = "0x3e622317f8C93f7328350cF0B56d9eD4C620C5d6"; // DAI  en Sepolia :contentReference[oaicite:1]{index=1}

// ───── Feeds Chainlink en Sepolia ─────
const USDC_FEED = "0xA2F78ab2355fe2f984D808B5CeE7FD0A93D5270E"; // USDC/USD feed :contentReference[oaicite:2]{index=2}
const DAI_FEED = "0x14866185B1962B63C3Ea9E03Bc1da838bab34C19"; // DAI/USD  feed :contentReference[oaicite:3]{index=3}

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with:", deployer.address);

  // 1) AToken
  const AToken = await ethers.getContractFactory("AToken");
  const aToken = await AToken.deploy("LendiFi aToken", "aLEND");
  await aToken.deployed();
  console.log("AToken deployed at:", aToken.address);

  // 2) PriceOracle
  const Oracle = await ethers.getContractFactory("PriceOracle");
  const oracle = await Oracle.deploy();
  await oracle.deployed();
  console.log("PriceOracle deployed at:", oracle.address);

  // Registrar feeds en Sepolia
  await (await oracle.setFeed(USDC, USDC_FEED)).wait();
  console.log("USDC/USD feed set");
  await (await oracle.setFeed(DAI, DAI_FEED)).wait();
  console.log("DAI/USD feed set");

  // 3) InterestRateModel
  const secsPerYear = BigNumber.from(365 * 24 * 3600);
  const RAY = BigNumber.from("1000000000000000000000000000"); // 1e27

  function aprToRaySec(aprPercent: number): BigNumber {
    return RAY.mul(aprPercent).div(100).div(secsPerYear);
  }

  const modelParams = {
    baseRate: aprToRaySec(2), // 2% APR
    slope1: aprToRaySec(10), // 10% APR
    slope2: aprToRaySec(100), // 100% APR
    optimal: BigNumber.from("800000000000000000"), // 0.8 WAD
  };

  const Model = await ethers.getContractFactory("InterestRateModel");
  const rateModel = await Model.deploy(modelParams);
  await rateModel.deployed();
  console.log("InterestRateModel deployed at:", rateModel.address);

  // 4) LendingPool
  const Pool = await ethers.getContractFactory("LendingPool");
  const pool = await Pool.deploy(
    aToken.address,
    oracle.address,
    rateModel.address
  );
  await pool.deployed();
  console.log("LendingPool deployed at:", pool.address);

  // 5) Transferir propiedad de aToken al pool
  await (await aToken.transferOwnership(pool.address)).wait();
  console.log("Ownership of aToken transferred to LendingPool");

  // 6) Configurar LTV y threshold (si implementado)
  // Ejemplo: LTV=75% (7500), Threshold=80% (8000) sobre base 1e4
  // await (await pool.configureReserve(USDC, 7500, 8000)).wait();
  // console.log("USDC reserve configured (LTV 75%, Threshold 80%)");
  // await (await pool.configureReserve(DAI,  7500, 8000)).wait();
  // console.log("DAI  reserve configured (LTV 75%, Threshold 80%)");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
