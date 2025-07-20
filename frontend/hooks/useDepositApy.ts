import { useQuery } from "@tanstack/react-query";
import { ethers } from "ethers";
import InterestRateModelAbi from "@/abis/InterestRateModel.json";

const WAD = BigInt("1000000000000000000");
const RAY = BigInt("1000000000000000000000000000");

const SECONDS_PER_YEAR = 365 * 24 * 60 * 60;

/**
 * APY
 *
 * @param rateModelAddress Address InterestRateModel
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
      const eth = (window as any).ethereum;
      if (!eth) throw new Error("No Ethereum provider");

      const provider = new ethers.BrowserProvider(eth);
      const model = new ethers.Contract(
        rateModelAddress,
        (InterestRateModelAbi as any).abi,
        provider
      );

      const utilWad =
        totalCollateral === BigInt(0)
          ? BigInt(0)
          : (totalDebt * WAD) / totalCollateral;

      const reserveFactorWad = WAD / BigInt(10); 

      const rawRateRay: bigint = await model.getDepositRate(
        utilWad,
        reserveFactorWad
      );

      const ratePerSec = Number(rawRateRay) / Number(RAY);

      const apr = ratePerSec * SECONDS_PER_YEAR;

      console.log(apr, "APR anual simple");
      console.log(Math.pow(1 + apr, 1), "APY anual simple");

      return (Math.pow(1 + apr, 1) - 1) * 100;
    },
    enabled: !!rateModelAddress,
    staleTime: 60_000,
    refetchInterval: 60_000,
  });
}
