// hooks/usePoolData.ts (simplified & ethers v6 compatible with explicit conversions)
import { useQuery } from "@tanstack/react-query";
import { ethers } from "ethers";
import LendingPoolAbi from "../abis/LendingPool.json";
import PriceOracleAbi from "../abis/PriceOracle.json";

export interface PoolData {
  totalCollateral: bigint;
  totalDebt: bigint;
  price: number;
}

/**
 * Simplified hook to fetch pool reserve data and token price, with debug logs.
 */
export function usePoolData(
  poolAddress: string,
  tokenAddress: string,
  oracleAddress: string
) {
  return useQuery<PoolData>({
    queryKey: ["poolData", poolAddress, tokenAddress],
    queryFn: async () => {
      console.log("usePoolData: starting fetch", { poolAddress, tokenAddress, oracleAddress });
      // Use BrowserProvider from ethers v6
      const ethereum = (window as any).ethereum;
      if (!ethereum) {
        console.error("usePoolData: no window.ethereum");
        throw new Error("No Ethereum provider found");
      }

      const provider = new ethers.BrowserProvider(ethereum as any);
      console.log("usePoolData: created provider");

      const poolContract = new ethers.Contract(
        poolAddress,
        (LendingPoolAbi as any).abi ?? LendingPoolAbi,
        provider
      );
      console.log("usePoolData: instantiated poolContract");

      const oracleContract = new ethers.Contract(
        oracleAddress,
        (PriceOracleAbi as any).abi ?? PriceOracleAbi,
        provider
      );
      console.log("usePoolData: instantiated oracleContract");

      try {
        console.log("usePoolData: calling getReserveData and getPrice");
        const [reserve, priceRes] = await Promise.all([
          poolContract.getReserveData(tokenAddress),
          oracleContract.getPrice(tokenAddress),
        ]);
        console.log("usePoolData: raw reserve", reserve);
        console.log("usePoolData: raw priceRes", priceRes);

        // priceRes fields may both be bigint
        const rawPrice = priceRes[0] as bigint;
        const decimals = priceRes[1] as bigint;
        console.log("usePoolData: rawPrice, decimals", rawPrice.toString(), decimals.toString());

        const decimalsNumber = Number(decimals);
        const price = Number(rawPrice) / 10 ** decimalsNumber;
        console.log("usePoolData: normalized price", price);

        const totalCollateral = BigInt(reserve.totalCollateral.toString());
        const totalDebt = BigInt(reserve.totalDebt.toString());
        console.log("usePoolData: computed totals", { totalCollateral, totalDebt });

        const data: PoolData = { totalCollateral, totalDebt, price };
        console.log("usePoolData: returning data", data);
        return data;
      } catch (err) {
        console.error("usePoolData: error during fetch", err);
        throw err;
      }
    },
    enabled: Boolean(poolAddress && tokenAddress && oracleAddress),
    staleTime: 5000,
    refetchInterval: 15000,
  });
}
