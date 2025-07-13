/* eslint-disable @typescript-eslint/consistent-type-imports */
"use client";

import { useEffect } from "react";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { useQueryClient } from "@tanstack/react-query";

import LendingPoolAbi from "@/abis/LendingPool.json";
import { refreshPool } from "@/lib/refreshPool";

/* ------------------------------------------------------------------ */
/* ‣ Dirección de la pool – usa tu env var pública                     */
/* ------------------------------------------------------------------ */
const POOL_ADDRESS = process.env
  .NEXT_PUBLIC_LENDING_POOL_ADDRESS as `0x${string}`;

/* ------------------------------------------------------------------ */
/* ‣ Hook                                                             */
/* ------------------------------------------------------------------ */
export function useLiquidate(tokenAddress: string) {
  const queryClient = useQueryClient();

  /* 1⃣  emitir transacción --------------------------------------------------- */
  const {
    writeContract,
    data: txHash,
    isPending: isBroadcasting,
    error: broadcastError,
  } = useWriteContract();

  /**
   * Dispara LendingPool.liquidate()
   *
   * @param victim     - address del prestatario a liquidar
   * @param repayWei   - cantidad que pagas (en wei) para liquidar
   */
  const liquidate = (victim: `0x${string}`, repayWei: bigint) =>
    writeContract({
      address: POOL_ADDRESS,
      abi: (LendingPoolAbi as any).abi ?? LendingPoolAbi,
      functionName: "liquidate",
      args: [tokenAddress, victim, repayWei],
    });

  /* 2⃣  esperar recibo ------------------------------------------------------- */
  const {
    isLoading: isWaitingReceipt,
    isSuccess,
    isError,
    error: receiptError,
  } = useWaitForTransactionReceipt({
    hash: txHash,
    // el hook se desactiva si hash === undefined ⇒ no necesitamos "enabled"
    confirmations: 1,
  });

  /* 3⃣  refrescar cache al éxito -------------------------------------------- */
  useEffect(() => {
    if (isSuccess) {
      refreshPool(queryClient, POOL_ADDRESS, tokenAddress);
    }
  }, [isSuccess, queryClient, tokenAddress]);

  /* 4⃣  logging opcional ----------------------------------------------------- */
  useEffect(() => {
    if (isError && receiptError) {
      // eslint-disable-next-line no-console
      console.error("[useLiquidate] ❌", receiptError);
    }
  }, [isError, receiptError]);

  /* 5⃣  API pública ---------------------------------------------------------- */
  return {
    liquidate,
    isProcessing: isBroadcasting || isWaitingReceipt,
    isSuccess,
    error: broadcastError ?? receiptError,
  };
}
