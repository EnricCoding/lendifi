// frontend/hooks/useBorrow.ts
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
 * Hook para pedir prestado.
 * @param tokenAddress Dirección del token que se va a pedir
 */
export function useBorrow(tokenAddress: string) {
  const { address } = useAccount();
  const queryClient = useQueryClient();

  /* 1⃣  emitir tx */
  const {
    writeContract,
    data: txHash,
    isPending: isBroadcasting,
    error: broadcastError,
  } = useWriteContract();

  const borrow = (amountWei: bigint) =>
    writeContract({
      address: POOL_ADDRESS as `0x${string}`,
      abi: (LendingPoolAbi as any).abi ?? LendingPoolAbi,
      functionName: "borrow",
      args: [tokenAddress, amountWei],
    });

  /* 2⃣  esperar recibo */
  const {
    isLoading: isWaitingReceipt,
    isSuccess,
    isError,
    error: receiptError,
  } = useWaitForTransactionReceipt({ hash: txHash });

  /* 3⃣  invalidar TODAS las queries de posición y pool */
  useEffect(() => {
    if (!isSuccess) return;

    queryClient.invalidateQueries({
      predicate: (q) =>
        Array.isArray(q.queryKey) && q.queryKey[0] === "userPosition",
    });
    queryClient.invalidateQueries({
      predicate: (q) =>
        Array.isArray(q.queryKey) && q.queryKey[0] === "poolData",
    });
  }, [isSuccess, queryClient]);

  /* 4⃣  log de error */
  useEffect(() => {
    if (isError && receiptError) {
      console.error("[useBorrow] ❌", receiptError);
    }
  }, [isError, receiptError]);

  const isProcessing = isBroadcasting || isWaitingReceipt;
  const error = broadcastError ?? receiptError;

  return { borrow, isProcessing, isSuccess, error };
}
