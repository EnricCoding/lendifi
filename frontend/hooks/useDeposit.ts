// frontend/hooks/useDeposit.ts
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { useQueryClient } from '@tanstack/react-query';
import LendingPoolAbi from '@/abis/LendingPool.json';

const POOL_ADDRESS = process.env.NEXT_PUBLIC_LENDING_POOL_ADDRESS!;

/**
 * Hook de depósito: envía la tx y permanece en “loading”
 * hasta que la transacción se mina o falla.
 */
export function useDeposit(tokenAddress: string) {
  const queryClient = useQueryClient();

  /** 1⃣  Emitimos la transacción (sale de Metamask) */
  const {
    writeContract,
    data: txHash,
    isPending: isBroadcasting,   // ↖️  true mientras el usuario firma / se envía al mempool
    error: broadcastError,
  } = useWriteContract();

  const deposit = (amountWei: bigint) => {
    console.log('[useDeposit] calling deposit', {
      pool: POOL_ADDRESS,
      token: tokenAddress,
      amountWei: amountWei.toString(),
    });

    writeContract({
      address: POOL_ADDRESS as `0x${string}`,
      abi: LendingPoolAbi.abi,
      functionName: 'deposit',
      args: [tokenAddress, amountWei],
    });
  };

  /** 2⃣  Esperamos el recibo (confirmación on-chain) */
  const {
    isLoading: isWaitingReceipt, // ↖️  true hasta que se mina
    isSuccess,
    isError,
    error: receiptError,
  } = useWaitForTransactionReceipt({ hash: txHash });

  /** 3⃣  Side-effects al confirmarse / fallar */
  if (isSuccess) {
    console.log('[useDeposit] ✅ confirmed', txHash);
    queryClient.invalidateQueries({ queryKey: ['poolData', POOL_ADDRESS, tokenAddress] });
    queryClient.invalidateQueries({ queryKey: ['userPosition', POOL_ADDRESS, tokenAddress] });
  }

  if (isError && receiptError) {
    console.error('[useDeposit] ❌ failed', receiptError);
  }

  /** 4⃣  Flag único para la UI */
  const isProcessing = isBroadcasting || isWaitingReceipt;

  return {
    deposit,            // fn(amountWei)
    isProcessing,  
    isSuccess,     // deshabilita botones e inputs
    error: broadcastError ?? receiptError,
  };
}
