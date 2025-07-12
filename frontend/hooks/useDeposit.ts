/* ─ frontend/hooks/useDeposit.ts ─ */
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

const POOL_ADDRESS = process.env.NEXT_PUBLIC_LENDING_POOL_ADDRESS!;

/**
 * Ejecuta LendingPool.deposit() y refresca poolData + userPosition
 * en cuanto la transacción queda minada.
 */
export function useDeposit(tokenAddress: string) {
  const { address } = useAccount();
  const queryClient = useQueryClient();

  /* 1⃣ - Emitir la transacción */
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

  /* 2⃣ - Esperar al recibo */
  const {
    isLoading: isWaitingReceipt,
    isSuccess,
    isError,
    error: receiptError,
  } = useWaitForTransactionReceipt({ hash: txHash });

  /* 3⃣ - Refrescar queries cuando se confirma */
  useEffect(() => {
    if (isSuccess) {
      console.log("[useDeposit] ✅ Transacción confirmada", txHash);
      refreshPool(queryClient, POOL_ADDRESS, tokenAddress);
    }
  }, [isSuccess, queryClient, tokenAddress]); //  ← tokenAddress añadido

  /* 4⃣ - Errores */
  useEffect(() => {
    if (isError && receiptError) {
      console.error("[useDeposit] ❌", receiptError);
      toast.error("La transacción falló ❌");
    }
  }, [isError, receiptError]);

  return {
    deposit,
    isProcessing: isBroadcasting || isWaitingReceipt,
    isSuccess,
    error: broadcastError ?? receiptError,
  };
}
