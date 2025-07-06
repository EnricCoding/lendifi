// frontend/hooks/useApprove.ts
import { useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import ERC20Abi from '@/abis/ERC20.json';
import { useQueryClient } from '@tanstack/react-query';
import { useAccount } from 'wagmi';

export function useApprove(
  tokenAddress: `0x${string}`,
  spender: `0x${string}`,
  amount: bigint,
) {
  const { address } = useAccount();
  const queryClient = useQueryClient();

  // 1) Lee allowance actual
  const { data: allowance = BigInt(0), refetch: refetchAllowance } = useReadContract({
    address: tokenAddress,
    abi: ERC20Abi,
    functionName: 'allowance',
    args: [address!, spender],
    // vuelve a leer en background
  });

  // 2) Prepara la tx approve
  const { writeContract: doApprove, data: approveHash, error: approveError } = useWriteContract();

  // 3) Espera confirmación para refrescar
  const { isLoading: isApprovingTx, isSuccess: approveSuccess } = useWaitForTransactionReceipt({
    hash: approveHash,
  });

  // Cuando mine, invalidamos y refetch allowance
  if (approveSuccess) {
    console.log('[useApprove] approval confirmed, refetching allowance');
    refetchAllowance();
    queryClient.invalidateQueries({ queryKey: ['userPosition'] });
    queryClient.invalidateQueries({ queryKey: ['poolData'] });
  }

  const approve = () => {
    console.log(`[useApprove] calling approve(${spender}, ${amount.toString()})`);
    doApprove({
      address: tokenAddress,
      abi: ERC20Abi,
      functionName: 'approve',
      args: [spender, amount],
    });
  };

  return {
    allowance,
    approve,
    isApproving: isApprovingTx,
    approveError,
  };
}
