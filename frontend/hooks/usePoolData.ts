import { useQuery } from "@tanstack/react-query";
import { ethers } from "ethers";
import LendingPoolAbi from "../abis/LendingPool.json";
import PriceOracleAbi from "../abis/PriceOracle.json";
import InterestRateModelAbi from "../abis/InterestRateModel.json";

export interface PoolData {
  totalCollateral: bigint;
  totalDebt: bigint;
  price: number;
  borrowApr: number; 
  depositApy: number; 
}

export function usePoolData(
  poolAddress: string,
  tokenAddress: string,
  oracleAddress: string
) {
  return useQuery<PoolData>({
    queryKey: ["poolData", poolAddress, tokenAddress],
    queryFn: async () => {
      const eth = (window as any).ethereum;
      if (!eth) throw new Error("No Ethereum provider");
      const provider = new ethers.BrowserProvider(eth);

      const poolContract = new ethers.Contract(
        poolAddress,
        LendingPoolAbi.abi,
        provider
      );
      const oracleContract = new ethers.Contract(
        oracleAddress,
        PriceOracleAbi.abi,
        provider
      );

      const [reserve, priceRes] = await Promise.all([
        poolContract.getReserveData(tokenAddress),
        oracleContract.getPrice(tokenAddress),
      ]);

      const totalCollateral = BigInt(reserve.totalCollateral.toString());
      const totalDebt = BigInt(reserve.totalDebt.toString());

      const rawPrice = priceRes[0] as bigint;
      const priceDec = Number(priceRes[1] as bigint);
      const price = Number(rawPrice) / 10 ** priceDec;

      const RAY = BigInt("1" + "0".repeat(27));
      const utilRay =
        totalCollateral === BigInt(0)
          ? RAY
          : (totalDebt * RAY) / totalCollateral;

      const rateModelAddr = await poolContract.rateModel();
      const model = new ethers.Contract(
        rateModelAddr,
        InterestRateModelAbi.abi,
        provider
      );
      const ratePerSec = (await model.getBorrowRate(utilRay)) as bigint;
      const secsPerYear = 60 * 60 * 24 * 365;

      const perSec = Number(ratePerSec) / 1e27;
      const borrowApr = perSec * secsPerYear;

      const utilFrac = Number(utilRay) / 1e27;
      const depositApy = borrowApr * utilFrac;

      return {
        totalCollateral,
        totalDebt,
        price,
        borrowApr,
        depositApy,
      };
    },
    enabled: Boolean(poolAddress && tokenAddress && oracleAddress),
    staleTime: 5000,
    refetchInterval: 15000,
  });
}
