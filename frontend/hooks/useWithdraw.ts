// frontend/hooks/useWithdraw.ts
"use client";

import { useEffect } from "react";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { useQueryClient } from "@tanstack/react-query";
import { refreshPool } from "@/lib/refreshPool"; // ⬅️ helper
import LendingPoolAbi from "@/abis/LendingPool.json";

const POOL_ADDRESS = process.env.NEXT_PUBLIC_LENDING_POOL_ADDRESS!;

/**
 * Retira colateral del pool y refresca poolData + userPosition
 * cuando la transacción se confirma.
 */
export function useWithdraw(tokenAddress: string) {
  const queryClient = useQueryClient();

  /* 1⃣  firma & broadcast */
  const {
    writeContract,
    data: txHash,
    isPending: isBroadcasting,
    error: broadcastError,
  } = useWriteContract();

  const withdraw = (amountWei: bigint) =>
    writeContract({
      address: POOL_ADDRESS as `0x${string}`,
      abi: (LendingPoolAbi as any).abi ?? LendingPoolAbi,
      functionName: "withdraw",
      args: [tokenAddress, amountWei],
    });

  /* 2⃣  recibo */
  const {
    isLoading: isWaitingReceipt,
    isSuccess,
    isError,
    error: receiptError,
  } = useWaitForTransactionReceipt({ hash: txHash });

  /* 3⃣  refrescar caché al éxito */
  useEffect(() => {
    if (isSuccess) {
      refreshPool(queryClient, POOL_ADDRESS, tokenAddress);
    }
  }, [isSuccess, queryClient, tokenAddress]);

  /* 4⃣  flags para la UI */
  const isProcessing = isBroadcasting || isWaitingReceipt;
  const error = broadcastError ?? receiptError;

  return {
    withdraw,
    isProcessing,
    isSuccess,
    error,
  };
}
