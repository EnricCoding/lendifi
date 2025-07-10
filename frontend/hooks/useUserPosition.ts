// hooks/useUserPosition.ts
import { useQuery } from "@tanstack/react-query";
import { useAccount } from "wagmi";
import { usePoolData } from "./usePoolData";
import { ethers } from "ethers";
import LendingPoolAbi from "@/abis/LendingPool.json";

/* --- tipos originales --- */
export interface UserPosition {
  collateral: bigint;
  debt: bigint;
  collateralValue: number;
  debtValue: number;
  healthFactor: number;
}

/**
 * Obtiene la posición del usuario:
 *  · colateral / deuda en raw (BigInt)
 *  · su valor en USD
 *  · health-factor               ( ≈ Aave )
 *
 * 🔄  Devuelve lo mismo que antes **y además**:
 *  · `deposited`   → alias de collateral
 *  · `borrowed`    → alias de debt
 *  · `loading`     → boolean de comodidad
 *
 * 👉  La firma **NO cambia** para no romper las pantallas existentes.
 */
export function useUserPosition(
  poolAddress: string,
  tokenAddress: string,
  oracleAddress: string
) {
  const { address, isConnected } = useAccount();

  /* reutilizamos tu hook de pool para precio */
  const poolQuery = usePoolData(poolAddress, tokenAddress, oracleAddress);

  const query = useQuery<UserPosition>({
    queryKey: ["userPosition", poolAddress, tokenAddress, address],
    queryFn: async () => {
      if (!address) throw new Error("Wallet no conectada");

      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const poolContract = new ethers.Contract(
        poolAddress,
        // 👉 compatibilidad con abi exportado como objeto o como { abi: [...] }
        (LendingPoolAbi as any).abi ?? LendingPoolAbi,
        provider
      );

      /* leer datos en paralelo */
      const [rawCollateral, rawDebt] = await Promise.all([
        poolContract.getUserCollateral(tokenAddress, address),
        poolContract.getUserDebt(tokenAddress, address),
      ]);

      const price = poolQuery.data?.price ?? 0;
      const collateralValue = Number(rawCollateral) * price;
      const debtValue = Number(rawDebt) * price;
      const healthFactor =
        debtValue > 0 ? collateralValue / debtValue : Infinity;

      return {
        collateral: rawCollateral as bigint,
        debt: rawDebt as bigint,
        collateralValue,
        debtValue,
        healthFactor,
      };
    },
    enabled: isConnected && !!address && poolQuery.isSuccess,
    staleTime: 10_000,
    refetchInterval: 30_000,
  });

  /* ------------------------------------------------------------------ *
   *  ⬇️  EXTENSIÓN *mínima*: solo añadimos alias + flag de carga
   * ------------------------------------------------------------------ */
  return {
    ...query, // 👈 conservas todas las props de React-Query
    deposited: query.data?.collateral ?? BigInt(0), // alias - UX
    borrowed: query.data?.debt ?? BigInt(0), // alias - UX
    healthFactor: query.data?.healthFactor ?? Infinity, // ➕ NUEVO alias
    loading: query.isLoading || query.isFetching, // alias - UX
  };
}
/* ---------------------------------------------------------------------- */
