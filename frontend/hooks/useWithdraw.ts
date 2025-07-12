// frontend/hooks/useWithdraw.ts
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
 * Retira colateral del pool.
 * @param tokenAddress Token que se retira
 */
export function useWithdraw(tokenAddress: string) {
  const { address } = useAccount();
  const queryClient = useQueryClient();

  /* 1⃣ firma & broadcast */
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

  /* 2⃣ recibo */
  const {
    isLoading: isWaitingReceipt,
    isSuccess,
    isError,
    error: receiptError,
  } = useWaitForTransactionReceipt({ hash: txHash });

  /* 3⃣ invalidar caché — prefijo 'userPosition' */
  useEffect(() => {
    if (!isSuccess) return;

    // refresca cualquier query que empiece por ['userPosition']
    queryClient.invalidateQueries({ queryKey: ["userPosition"] });
    queryClient.invalidateQueries({ queryKey: ["poolData"] });
  }, [isSuccess, queryClient]);

  /* 4⃣ flags para la UI */
  const isProcessing = isBroadcasting || isWaitingReceipt;

  return {
    withdraw,
    isProcessing,
    isSuccess,
    error: broadcastError ?? receiptError,
  };
}
