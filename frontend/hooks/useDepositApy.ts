// frontend/hooks/useDepositApy.ts
import { useQuery } from "@tanstack/react-query";
import { ethers } from "ethers";
import InterestRateModelAbi from "@/abis/InterestRateModel.json";

// Constantes de escala
const WAD = BigInt("1000000000000000000"); // 1e18
const RAY = BigInt("1000000000000000000000000000"); // 1e27
const SECONDS_PER_YEAR = 365 * 24 * 60 * 60;

/**
 * Hook para obtener la APY estimada de depósito en un pool.
 * Usa getDepositRate(utilizationWad, reserveFactorWad) del contrato.
 * @param rateModelAddress Dirección del InterestRateModel
 * @param totalCollateral Total de colateral (bigint, en wei)
 * @param totalDebt Total de deuda (bigint, en wei)
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
      const ethereum = (window as any).ethereum;
      if (!ethereum) throw new Error("No Ethereum provider found");
      const provider = new ethers.BrowserProvider(ethereum as any);
      const contract = new ethers.Contract(
        rateModelAddress,
        (InterestRateModelAbi as any).abi,
        provider
      );

      // Cálculo de utilización en WAD (1e18)
      const coll = totalCollateral;
      const debt = totalDebt;
      const utilWad = coll === BigInt(0) ? BigInt(0) : (debt * WAD) / coll;

      // Reserve factor fijo: 10% = 0.1 WAD
      const reserveFactorWad = WAD / BigInt(10);

      // Llamada al contrato: tasa en RAY/segundo
      const rawRateRay: bigint = await contract.getDepositRate(
        utilWad,
        reserveFactorWad
      );

      // Convertir de RAY/segundo a decimal por segundo
      const ratePerSec = Number(rawRateRay) / 1e27;

      // APR simple anual
      const apr = ratePerSec * SECONDS_PER_YEAR;

      // APY aproximado (sin composición intra-anual)
      const apy = (Math.pow(1 + apr, 1) - 1) * 100;
      return apy;
    },
    enabled: Boolean(rateModelAddress && totalCollateral >= BigInt(0)),
    staleTime: 60_000,
    refetchInterval: 60_000,
  });
}
