// hooks/useUserPosition.ts
"use client";

import { useQuery, UseQueryResult } from "@tanstack/react-query";
import { useAccount } from "wagmi";
import { ethers } from "ethers";

import { usePoolData } from "./usePoolData";
import LendingPoolAbi from "@/abis/LendingPool.json";

export interface UserPosition {
  collateral: bigint; 
  debt: bigint;        
  collateralValue: number;
  debtValue: number; 
  healthFactor: number;
}

export function useUserPosition(
  poolAddress: string,
  tokenAddress: string,
  oracleAddress: string
) {
  const { address, isConnected } = useAccount();
  const poolQuery = usePoolData(poolAddress, tokenAddress, oracleAddress);

  const query: UseQueryResult<UserPosition, Error> = useQuery<UserPosition>({
    queryKey: ["userPosition", poolAddress, tokenAddress, address],
    enabled: isConnected && !!address && poolQuery.isSuccess,
    staleTime: 10_000,
    refetchInterval: 30_000,

    queryFn: async (): Promise<UserPosition> => {
      if (!address) throw new Error("Wallet no conectada");

      console.log("[useUserPosition] 🔄 fetch", { poolAddress, tokenAddress, address });

      const provider = new ethers.BrowserProvider(
        (window as unknown as { ethereum: any }).ethereum
      );

      const pool = new ethers.Contract(
        poolAddress,
        (LendingPoolAbi as any).abi ?? LendingPoolAbi,
        provider
      );

      const erc20 = new ethers.Contract(
        tokenAddress,
        ["function decimals() view returns (uint8)"],
        provider
      );

      const [rawCollateral, rawDebt, healthFactorRaw, tokenDecBn] =
        (await Promise.all([
          pool.getUserCollateral(tokenAddress, address),
          pool.getUserDebt(tokenAddress, address),
          pool.getHealthFactor(tokenAddress, address), // WAD
          erc20.decimals(),
        ])) as [bigint, bigint, bigint, bigint];

      const tokenDec = Number(tokenDecBn);      // p.ej. 6 para USDC
      const factor = 10 ** tokenDec;

      const priceUsd = poolQuery.data!.price;

      const collateralValue = (Number(rawCollateral) / factor) * priceUsd;
      const debtValue       = (Number(rawDebt)       / factor) * priceUsd;

      const healthFactor =
        rawDebt === BigInt(0) ? Infinity : Number(healthFactorRaw) / 1e18;

      return {
        collateral: rawCollateral,
        debt: rawDebt,
        collateralValue,
        debtValue,
        healthFactor,
      }
    },
  });

  return {
    ...query,
    deposited:   query.data?.collateral    ?? BigInt(0),
    borrowed:    query.data?.debt          ?? BigInt(0),
    healthFactor: query.data?.healthFactor ?? Infinity,
    loading: query.isLoading || query.isFetching,
  };
};