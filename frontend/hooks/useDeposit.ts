"use client";

import { useEffect } from "react";
import {
  useWriteContract,
  useWaitForTransactionReceipt,
  useAccount,
} from "wagmi";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import LendingPoolAbi from "@/abis/LendingPool.json";
import { refreshPool } from "@/lib/refreshPool";

const POOL_ADDRESS = process.env
  .NEXT_PUBLIC_LENDING_POOL_ADDRESS! as `0x${string}`;

export function useDeposit(tokenAddress: string) {
  const { address } = useAccount();
  const queryClient = useQueryClient();

  const {
    writeContract,
    data: txHash,
    isPending: isBroadcasting,
    error: broadcastError,
  } = useWriteContract();

  const deposit = (amountWei: bigint) =>
    writeContract({
      address: POOL_ADDRESS,
      abi: (LendingPoolAbi as any).abi ?? LendingPoolAbi,
      functionName: "deposit",
      args: [tokenAddress, amountWei],
    });

  const {
    isLoading: isWaitingReceipt,
    isSuccess,
    isError,
    error: receiptError,
  } = useWaitForTransactionReceipt({
    hash: txHash,
    confirmations: 2, 
  });

  useEffect(() => {
    if (!isSuccess) return;

    console.log("[useDeposit] confirmed at +2 blocks → refetch");
    refreshPool(queryClient, POOL_ADDRESS, tokenAddress);

    queryClient.invalidateQueries({
      queryKey: ["userPosition", POOL_ADDRESS, tokenAddress, address],
    });
  }, [isSuccess, queryClient, tokenAddress, address]);

  useEffect(() => {
    if (isError && receiptError) {
      console.error("[useDeposit]", receiptError);
      toast.error("Transaction failed");
    }
  }, [isError, receiptError]);

  return {
    deposit,
    isProcessing: isBroadcasting || isWaitingReceipt,
    isSuccess,
    error: broadcastError ?? receiptError,
  };
}
