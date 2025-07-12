// frontend/hooks/useRepay.ts
"use client";

import { useEffect } from "react";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { useQueryClient } from "@tanstack/react-query";
import { refreshPool } from "@/lib/refreshPool"; // ⬅️ helper
import LendingPoolAbi from "@/abis/LendingPool.json";

const POOL_ADDRESS = process.env.NEXT_PUBLIC_LENDING_POOL_ADDRESS!;

/**
 * Hook para reembolsar (repay) deuda y forzar que poolData + userPosition
 * se refresquen en cuanto la transacción queda confirmada.
 */
export function useRepay(tokenAddress: string) {
  const queryClient = useQueryClient();

  /* 1⃣  Emitir la transacción */
  const {
    writeContract,
    data: txHash,
    isPending: isBroadcasting,
    error: broadcastError,
  } = useWriteContract();

  const repay = (amountWei: bigint) =>
    writeContract({
      address: POOL_ADDRESS as `0x${string}`,
      abi: (LendingPoolAbi as any).abi ?? LendingPoolAbi,
      functionName: "repay",
      args: [tokenAddress, amountWei],
    });

  /* 2⃣  Esperar recibo */
  const {
    isLoading: isWaitingReceipt,
    isSuccess,
    isError,
    error: receiptError,
  } = useWaitForTransactionReceipt({ hash: txHash });

  /* 3⃣  Refrescar caché al éxito */
  useEffect(() => {
    if (isSuccess) {
      refreshPool(queryClient, POOL_ADDRESS, tokenAddress);
    }
  }, [isSuccess, queryClient, tokenAddress]);

  /* 4⃣  Log de error (opcional) */
  useEffect(() => {
    if (isError && receiptError) {
      console.error("[useRepay] ❌", receiptError);
    }
  }, [isError, receiptError]);

  /* Flags para la UI */
  const isProcessing = isBroadcasting || isWaitingReceipt;
  const error = broadcastError ?? receiptError;

  return { repay, isProcessing, isSuccess, error };
}
