"use client";

import { useEffect } from "react";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { useQueryClient } from "@tanstack/react-query";

import LendingPoolAbi from "@/abis/LendingPool.json";
import { refreshPool } from "@/lib/refreshPool";

const POOL_ADDRESS = process.env
  .NEXT_PUBLIC_LENDING_POOL_ADDRESS as `0x${string}`;

export function useLiquidate(tokenAddress: string) {
  const queryClient = useQueryClient();

  const {
    writeContract,
    data: txHash,
    isPending: isBroadcasting,
    error: broadcastError,
  } = useWriteContract();

  const liquidate = (victim: `0x${string}`, repayWei: bigint) =>
    writeContract({
      address: POOL_ADDRESS,
      abi: (LendingPoolAbi as any).abi ?? LendingPoolAbi,
      functionName: "liquidate",
      args: [tokenAddress, victim, repayWei],
    });

  const {
    isLoading: isWaitingReceipt,
    isSuccess,
    isError,
    error: receiptError,
  } = useWaitForTransactionReceipt({
    hash: txHash,
    confirmations: 1,
  });

  useEffect(() => {
    if (isSuccess) {
      refreshPool(queryClient, POOL_ADDRESS, tokenAddress);
    }
  }, [isSuccess, queryClient, tokenAddress]);

  useEffect(() => {
    if (isError && receiptError) {
      console.error("[useLiquidate]", receiptError);
    }
  }, [isError, receiptError]);

  return {
    liquidate,
    isProcessing: isBroadcasting || isWaitingReceipt,
    isSuccess,
    error: broadcastError ?? receiptError,
  };
}
