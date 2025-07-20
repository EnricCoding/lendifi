"use client";

import { useEffect } from "react";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { useQueryClient } from "@tanstack/react-query";
import { refreshPool } from "@/lib/refreshPool";
import LendingPoolAbi from "@/abis/LendingPool.json";

const POOL_ADDRESS = process.env
  .NEXT_PUBLIC_LENDING_POOL_ADDRESS! as `0x${string}`;


export function useBorrow(tokenAddress: string) {
  const queryClient = useQueryClient();

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

  const {
    isLoading: isWaitingReceipt,
    isSuccess,
    isError,
    error: receiptError,
  } = useWaitForTransactionReceipt({ hash: txHash });

  useEffect(() => {
    if (!isSuccess) return;
    refreshPool(queryClient, POOL_ADDRESS, tokenAddress);
    queryClient.invalidateQueries({
      queryKey: ["userPosition", POOL_ADDRESS, tokenAddress],
    });
  }, [isSuccess, queryClient, tokenAddress]);

  useEffect(() => {
    if (isError && receiptError) {
      console.error("[useBorrow]", receiptError);
    }
  }, [isError, receiptError]);

  return {
    borrow,
    isProcessing: isBroadcasting || isWaitingReceipt,
    isSuccess,
    error: broadcastError ?? receiptError,
  };
}
