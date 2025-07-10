// frontend/hooks/useDeposit.ts
import { useEffect } from "react";
import {
  useWriteContract,
  useWaitForTransactionReceipt,
  useAccount,
} from "wagmi";
import { useQueryClient } from "@tanstack/react-query";
import LendingPoolAbi from "@/abis/LendingPool.json";

const POOL_ADDRESS = process.env.NEXT_PUBLIC_LENDING_POOL_ADDRESS!;

export function useDeposit(tokenAddress: string) {
  const { address } = useAccount();
  const queryClient = useQueryClient();

  /* 1⃣  Emitimos la transacción */
  const {
    writeContract,
    data: txHash,
    isPending: isBroadcasting,
    error: broadcastError,
  } = useWriteContract();

  const deposit = (amountWei: bigint) =>
    writeContract({
      address: POOL_ADDRESS as `0x${string}`,
      abi: (LendingPoolAbi as any).abi ?? LendingPoolAbi,
      functionName: "deposit",
      args: [tokenAddress, amountWei],
    });

  /* 2⃣  Esperamos el recibo */
  const {
    isLoading: isWaitingReceipt,
    isSuccess,
    isError,
    error: receiptError,
  } = useWaitForTransactionReceipt({ hash: txHash });

  /* 3⃣  Side-effects (una sola vez) */
  useEffect(() => {
    if (!isSuccess) return;
    // ✅ tx confirmada → refrescar datos
    queryClient.invalidateQueries({ queryKey: ["poolData"] });
    if (address) {
      queryClient.invalidateQueries({
        queryKey: ["userPosition", POOL_ADDRESS, tokenAddress, address],
      });
    }
  }, [isSuccess, queryClient, address, tokenAddress]);

  useEffect(() => {
    if (isError && receiptError) {
      console.error("[useDeposit] ❌ failed", receiptError);
    }
  }, [isError, receiptError]);

  /* 4⃣  Flag para la UI */
  const isProcessing = isBroadcasting || isWaitingReceipt;

  return {
    deposit,
    isProcessing,
    isSuccess,
    error: broadcastError ?? receiptError,
  };
}
