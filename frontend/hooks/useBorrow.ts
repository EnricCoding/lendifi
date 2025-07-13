// frontend/hooks/useBorrow.ts
"use client";

import { useEffect } from "react";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { useQueryClient } from "@tanstack/react-query";
import { refreshPool } from "@/lib/refreshPool";
import LendingPoolAbi from "@/abis/LendingPool.json";

const POOL_ADDRESS = process.env
  .NEXT_PUBLIC_LENDING_POOL_ADDRESS! as `0x${string}`;

/**
 * Hook para ejecutar LendingPool.borrow() y refrescar
 * poolData + userPosition en cuanto la tx se mina.
 */
export function useBorrow(tokenAddress: string) {
  const queryClient = useQueryClient();

  /* 1⃣ emitir la transacción */
  const {
    writeContract,
    data: txHash,
    isPending: isBroadcasting,
    error: broadcastError,
  } = useWriteContract();

  const borrow = (amountWei: bigint) =>
    writeContract({
      address: POOL_ADDRESS,
      abi: (LendingPoolAbi as any).abi ?? LendingPoolAbi,
      functionName: "borrow",
      args: [tokenAddress, amountWei],
    });

  /* 2⃣ esperar el recibo */
  const {
    isLoading: isWaitingReceipt,
    isSuccess,
    isError,
    error: receiptError,
  } = useWaitForTransactionReceipt({ hash: txHash });

  /* 3⃣ refrescar datos al éxito */
  useEffect(() => {
    if (!isSuccess) return;
    // refresca la data de la pool
    refreshPool(queryClient, POOL_ADDRESS, tokenAddress);
    // invalida también la posición del usuario para que se refetch inmediato
    queryClient.invalidateQueries({
      queryKey: ["userPosition", POOL_ADDRESS, tokenAddress],
    });
  }, [isSuccess, queryClient, tokenAddress]);

  /* 4⃣ logging opcional */
  useEffect(() => {
    if (isError && receiptError) {
      console.error("[useBorrow] ❌", receiptError);
    }
  }, [isError, receiptError]);

  return {
    borrow,
    isProcessing: isBroadcasting || isWaitingReceipt,
    isSuccess,
    error: broadcastError ?? receiptError,
  };
}
