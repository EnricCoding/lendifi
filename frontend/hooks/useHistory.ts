// frontend/hooks/useHistory.ts
import { useQuery } from "@tanstack/react-query";
import { ethers } from "ethers";
import LendingPoolAbi from "@/abis/LendingPool.json";

export interface Point {
  ts: number; // milisegundos UNIX
  collateral: number; // en tokens (no en wei)
  debt: number; // en tokens (no en wei)
}

/**
 * Hook que reconstruye la historia de colateral/deuda de un usuario
 * filtrando eventos en la pool y consultando el estado tras cada uno.
 *
 * @param poolAddress    Dirección de LendingPool
 * @param tokenAddress   Dirección del token (por ejemplo USDC)
 * @param user           Dirección del usuario a inspeccionar
 * @param tokenDecimals  Decimales del token (por ejemplo 6 para USDC)
 */
export function useHistory(
  poolAddress: string,
  tokenAddress: string,
  user: `0x${string}`,
  tokenDecimals: number
) {
  return useQuery<Point[]>({
    queryKey: ["history", poolAddress, tokenAddress, user],
    queryFn: async () => {
      // 1) Conectar provider
      const ethereum = (window as any).ethereum;
      if (!ethereum) throw new Error("No Ethereum provider");
      const provider = new ethers.BrowserProvider(ethereum as any);

      // 2) Instanciar contrato
      const pool = new ethers.Contract(
        poolAddress,
        (LendingPoolAbi as any).abi,
        provider
      );

      // 3) Calcular rango de bloques: últimos 100k
        const latest = await provider.getBlockNumber();
      const fromBlock = latest > 10_000 ? latest - 10_000 : 0;


      // 4) Crear filtros para cada evento del usuario
      const fD = pool.filters.Deposit(tokenAddress, user);
      const fW = pool.filters.Withdraw(tokenAddress, user);
      const fB = pool.filters.Borrow(tokenAddress, user);
      const fR = pool.filters.Repay(tokenAddress, user);

      // 5) Leer logs solo en ese rango
      const [d, w, b, r] = (await Promise.all([
        provider.getLogs({ ...fD, fromBlock, toBlock: latest }),
        provider.getLogs({ ...fW, fromBlock, toBlock: latest }),
        provider.getLogs({ ...fB, fromBlock, toBlock: latest }),
        provider.getLogs({ ...fR, fromBlock, toBlock: latest }),
      ])) as ethers.Log[][];

      // 6) Aplanar y ordenar
      const allLogs: ethers.Log[] = [...d, ...w, ...b, ...r].sort(
        (x, y) => x.blockNumber - y.blockNumber
      );

      const points: Point[] = [];

      // 7) Por cada evento, leer timestamp y estado on-chain
      for (const log of allLogs) {
        const block = await provider.getBlock(log.blockNumber);
        if (!block) continue;

        const [rawColl, rawDebt] = await Promise.all([
          pool.getUserCollateral(tokenAddress, user) as Promise<bigint>,
          pool.getUserDebt(tokenAddress, user) as Promise<bigint>,
        ]);

        const factor = 10 ** tokenDecimals;
        const collateral = Number(rawColl) / factor;
        const debt = Number(rawDebt) / factor;

        points.push({
          ts: block.timestamp * 1000,
          collateral,
          debt,
        });
      }

      console.log("[useHistory] 🔄 fetch", {
        poolAddress,
        tokenAddress,
        user,
        points,
      });
      return points;
    },
    enabled: Boolean(poolAddress && tokenAddress && user),
    staleTime: 60_000,
    refetchInterval: 60_000,
  });
}
