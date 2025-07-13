// frontend/hooks/useDepositApy.ts
import { useQuery } from "@tanstack/react-query";
import { ethers } from "ethers";
import InterestRateModelAbi from "@/abis/InterestRateModel.json";

/* ─── constantes sin literales BigInt ────────────────────────────── */
// 1e18  →  18 ceros
const WAD = BigInt("1000000000000000000");
// 1e27  →  27 ceros
const RAY = BigInt("1000000000000000000000000000");

const SECONDS_PER_YEAR = 365 * 24 * 60 * 60;

/**
 * APY estimada para depósitos.
 *
 * @param rateModelAddress Address del InterestRateModel
 * @param totalCollateral  BigInt (wei)
 * @param totalDebt        BigInt (wei)
 */
export function useDepositApy(
  rateModelAddress: string,
  totalCollateral: bigint,
  totalDebt: bigint
) {
  
  return useQuery<number>({
    queryKey: [
      "depositApy",
      rateModelAddress,
      totalCollateral.toString(),
      totalDebt.toString(),
    ],
    queryFn: async () => {
      /* provider + contrato */
      const eth = (window as any).ethereum;
      if (!eth) throw new Error("No Ethereum provider");

      const provider = new ethers.BrowserProvider(eth);
      const model = new ethers.Contract(
        rateModelAddress,
        (InterestRateModelAbi as any).abi,
        provider
      );

      /* utilización en WAD */
      const utilWad =
        totalCollateral === BigInt(0)
          ? BigInt(0)
          : (totalDebt * WAD) / totalCollateral;

      /* reserve factor fijo 10 % */
      const reserveFactorWad = WAD / BigInt(10); // 0.1 WAD

      /* tasa (ray/seg) */
      const rawRateRay: bigint = await model.getDepositRate(
        utilWad,
        reserveFactorWad
      );

      /* ray → decimal/seg  ◀︎ sin BigInt al dividir */
      const ratePerSec = Number(rawRateRay) / Number(RAY);

      /* APR anual simple */
      const apr = ratePerSec * SECONDS_PER_YEAR;

      console.log(apr, "APR anual simple");
      console.log(Math.pow(1 + apr, 1), "APY anual simple");

      /* APY ≈ APR (sin composición intra-año) */
      return (Math.pow(1 + apr, 1) - 1) * 100;
    },
    enabled: !!rateModelAddress,
    staleTime: 60_000,
    refetchInterval: 60_000,
  });
}
