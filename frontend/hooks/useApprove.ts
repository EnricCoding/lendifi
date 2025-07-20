import {
  useWriteContract,
  useWaitForTransactionReceipt,
  useReadContract,
} from "wagmi";
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAccount } from "wagmi";
import ERC20Abi from "@/abis/ERC20.json";

export function useApprove(
  tokenAddress: `0x${string}`,
  spender: `0x${string}`,
  amount: bigint
) {
  const { address } = useAccount();
  const queryClient = useQueryClient();

  const { data: allowance = BigInt(0), refetch: refetchAllowance } = useReadContract({
    address: tokenAddress,
    abi: ERC20Abi,
    functionName: "allowance",
    args: [address!, spender],
  });

  const {
    writeContract: doApprove,
    data: txHash,
    error: approveError,
  } = useWriteContract();

  const { isLoading: isApprovingTx, isSuccess: approveSuccess } =
    useWaitForTransactionReceipt({ hash: txHash });

  useEffect(() => {
    if (!approveSuccess) return; 
    refetchAllowance(); 
    queryClient.invalidateQueries({ queryKey: ["userPosition"] });
    queryClient.invalidateQueries({ queryKey: ["poolData"] });
  }, [approveSuccess, refetchAllowance, queryClient]);

  const approve = () =>
    doApprove({
      address: tokenAddress,
      abi: ERC20Abi,
      functionName: "approve",
      args: [spender, amount],
    });

  return {
    allowance,
    approve,
    isApproving: isApprovingTx,
    approveError,
  };
}
