// frontend/hooks/useRepay.ts
import { useEffect } from "react";
import {
  useWriteContract,
  useWaitForTransactionReceipt,
  useAccount,
} from "wagmi";
import { useQueryClient } from "@tanstack/react-query";
import LendingPoolAbi from "@/abis/LendingPool.json";

const POOL_ADDRESS = process.env.NEXT_PUBLIC_LENDING_POOL_ADDRESS!;

/**
 * Hook para reembolsar (repay) deuda.
 * @param tokenAddress Dirección del token a reembolsar
 */
export function useRepay(tokenAddress: string) {
  const { address } = useAccount();
  const queryClient = useQueryClient();

  /* 1⃣   Emitimos la transacción */
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

  /* 2⃣   Esperamos el recibo */
  const {
    isLoading: isWaitingReceipt,
    isSuccess,
    isError,
    error: receiptError,
  } = useWaitForTransactionReceipt({ hash: txHash });

  /* 3⃣   Invalidamos TODAS las queries de posición y pool */
  useEffect(() => {
    if (!isSuccess) return;

    // userPosition queries
    queryClient.invalidateQueries({
      predicate: (q) =>
        Array.isArray(q.queryKey) && q.queryKey[0] === "userPosition",
    });

    // poolData queries
    queryClient.invalidateQueries({
      predicate: (q) =>
        Array.isArray(q.queryKey) && q.queryKey[0] === "poolData",
    });
  }, [isSuccess, queryClient]);

  /* 4⃣   Log de error (opcional) */
  useEffect(() => {
    if (isError && receiptError) {
      console.error("[useRepay] ❌ failed", receiptError);
    }
  }, [isError, receiptError]);

  /* 5⃣   Flags para la UI */
  const isProcessing = isBroadcasting || isWaitingReceipt;

  return {
    repay, // (amountWei: bigint) => void
    isProcessing, // boolean
    isSuccess, // boolean
    error: broadcastError ?? receiptError, // Error | undefined
  };
}
