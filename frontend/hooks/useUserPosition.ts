// hooks/useUserPosition.ts (simplified)
import { useQuery } from "@tanstack/react-query";
import { useAccount } from "wagmi";
import { usePoolData } from "./usePoolData";
import { ethers } from "ethers";
import LendingPoolAbi from "../abis/LendingPool.json";

export interface UserPosition {
  collateral: bigint;
  debt: bigint;
  collateralValue: number;
  debtValue: number;
  healthFactor: number;
}

/**
 * Hook to fetch user's collateral and debt, then compute values and HF.
 */
export function useUserPosition(
  poolAddress: string,
  tokenAddress: string,
  oracleAddress: string
) {
  const { address, isConnected } = useAccount();
  const poolQuery = usePoolData(poolAddress, tokenAddress, oracleAddress);

  return useQuery<UserPosition>({
    queryKey: ["userPosition", poolAddress, tokenAddress, address],
    queryFn: async () => {
      if (!address) throw new Error("Wallet no conectado");

      const provider = new ethers.BrowserProvider(
        (window as any).ethereum as any
      );
      const poolContract = new ethers.Contract(
        poolAddress,
        (LendingPoolAbi as any).abi ?? LendingPoolAbi,
        provider
      );

      // Fetch collateral and debt in parallel
      const [rawCollateral, rawDebt] = await Promise.all([
        poolContract.getUserCollateral(tokenAddress, address),
        poolContract.getUserDebt(tokenAddress, address),
      ]);

      const price = poolQuery.data?.price ?? 0;
      const collateralValue = Number(rawCollateral) * price;
      const debtValue = Number(rawDebt) * price;
      const healthFactor =
        debtValue > 0 ? collateralValue / debtValue : Infinity;

      return {
        collateral: rawCollateral as bigint,
        debt: rawDebt as bigint,
        collateralValue,
        debtValue,
        healthFactor,
      };
    },
    enabled: isConnected && !!address && poolQuery.isSuccess,
    staleTime: 10_000,
    refetchInterval: 30_000,
  });
}
