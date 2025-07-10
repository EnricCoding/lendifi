// frontend/hooks/useApprove.ts
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

  /* 1⃣  allowance on-chain */
  const { data: allowance = BigInt(0), refetch: refetchAllowance } = useReadContract({
    address: tokenAddress,
    abi: ERC20Abi,
    functionName: "allowance",
    args: [address!, spender],
  });

  /* 2⃣  enviamos approve */
  const {
    writeContract: doApprove,
    data: txHash,
    error: approveError,
  } = useWriteContract();

  /* 3⃣  esperamos recibo */
  const { isLoading: isApprovingTx, isSuccess: approveSuccess } =
    useWaitForTransactionReceipt({ hash: txHash });

  /* 4⃣  side-effects ⇒ una sola vez */
  useEffect(() => {
    if (!approveSuccess) return; // sólo cuando pasa a true
    refetchAllowance(); // refresca el allowance leído
    queryClient.invalidateQueries({ queryKey: ["userPosition"] });
    queryClient.invalidateQueries({ queryKey: ["poolData"] });
  }, [approveSuccess, refetchAllowance, queryClient]);

  /* helper para la UI */
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
