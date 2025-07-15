// frontend/hooks/useHistory.ts
"use client";

import { useQuery } from "@tanstack/react-query";
import { ethers, type Log, type Filter } from "ethers";
import LendingPoolAbi from "@/abis/LendingPool.json";

export type EventType = "Deposit" | "Withdraw" | "Borrow" | "Repay";
export interface Point {
  ts: number; // timestamp en ms
  collateral: number;
  debt: number;
  event: EventType;
}

// Aproximación: Ethereum mina ~6500 bloques al día
const BLOCKS_PER_DAY = 6500;

export function useHistory(
  poolAddress: string,
  tokenAddress: string,
  user: `0x${string}`,
  tokenDecimals: number,
  daysAgo = 7 // último X días
) {
  const blockRange = daysAgo * BLOCKS_PER_DAY;

  return useQuery<Point[]>({
    queryKey: ["history", poolAddress, tokenAddress, user, daysAgo],
    enabled:
      !!poolAddress &&
      !!tokenAddress &&
      !!user &&
      typeof window !== "undefined" &&
      !!(window as any).ethereum,
    staleTime: 60_000,
    refetchInterval: 60_000,
    queryFn: async (): Promise<Point[]> => {
      console.log("[useHistory] ▶️ start", {
        poolAddress,
        tokenAddress,
        user,
        daysAgo,
      });

      const eth = (window as any).ethereum;
      if (!eth) throw new Error("No Ethereum provider");
      const provider = new ethers.BrowserProvider(eth);
      const pool = new ethers.Contract(
        poolAddress,
        LendingPoolAbi.abi,
        provider
      );

      // 1) rango de bloques
      const latest = await provider.getBlockNumber();
      const fromBlock = Math.max(0, latest - blockRange);
      console.log("[useHistory] ⛏ blocks", { fromBlock, latest, blockRange });

      // 2) extraer topics (sigue igual que antes)
      const depTopics = (pool.filters.Deposit(tokenAddress, user) as any)
        .topics;
      const witTopics = (pool.filters.Withdraw(tokenAddress, user) as any)
        .topics;
      const borTopics = (pool.filters.Borrow(tokenAddress, user) as any).topics;
      const repTopics = (pool.filters.Repay(tokenAddress, user) as any).topics;

      // 3) helper recursivo de getLogs
      async function fetchLogsRec(
        topics: Array<string | null>,
        start: number,
        end: number
      ): Promise<Log[]> {
        const filter: Filter = {
          address: poolAddress,
          topics,
          fromBlock: start,
          toBlock: end,
        };
        console.log(`↕️ getLogs [${start}..${end}] topics=`, topics);
        try {
          return await provider.getLogs(filter);
        } catch (err: any) {
          const msg = err?.message ?? "";
          if (msg.includes("more than 10000")) {
            const mid = Math.floor((start + end) / 2);
            console.log(`🔀 split [${start}..${mid}] & [${mid + 1}..${end}]`);
            const left = await fetchLogsRec(topics, start, mid);
            const right = await fetchLogsRec(topics, mid + 1, end);
            return [...left, ...right];
          }
          console.error("[useHistory] ❌ getLogs error", err);
          throw err;
        }
      }

      // 4) fetch todos los logs
      const [dLogs, wLogs, bLogs, rLogs] = await Promise.all([
        fetchLogsRec(depTopics, fromBlock, latest),
        fetchLogsRec(witTopics, fromBlock, latest),
        fetchLogsRec(borTopics, fromBlock, latest),
        fetchLogsRec(repTopics, fromBlock, latest),
      ]);

      // 5) merge y ordenar por bloque + txIndex
      const allLogs = [...dLogs, ...wLogs, ...bLogs, ...rLogs].sort((a, b) => {
        if (a.blockNumber !== b.blockNumber)
          return a.blockNumber - b.blockNumber;
        return (a.transactionIndex ?? 0) - (b.transactionIndex ?? 0);
      });
      console.log("[useHistory] 🪄 total raw logs", allLogs.length);

      // 6) reconstruir puntos *únicos* detectando cambios
      const points: Point[] = [];
      let prevColl = 0;
      let prevDebt = 0;

      for (const log of allLogs) {
        const block = await provider.getBlock(log.blockNumber);
        if (!block) continue;

        const [rawColl, rawDebt] = await Promise.all([
          pool.getUserCollateral(tokenAddress, user, {
            blockTag: log.blockNumber,
          }),
          pool.getUserDebt(tokenAddress, user, { blockTag: log.blockNumber }),
        ]);
        const factor = 10 ** tokenDecimals;
        const coll = Number(rawColl) / factor;
        const debt = Number(rawDebt) / factor;

        // 6a) skip si no hay cambio
        if (coll === prevColl && debt === prevDebt) {
          console.log("[useHistory]   skip no-change at", log.blockNumber);
          continue;
        }

        // 6b) determinar tipo de evento
        let event: EventType;
        if (coll > prevColl) event = "Deposit";
        else if (coll < prevColl) event = "Withdraw";
        else if (debt > prevDebt) event = "Borrow";
        else event = "Repay";

        const point: Point = {
          ts: block.timestamp * 1000,
          collateral: coll,
          debt,
          event,
        };
        console.log("[useHistory]   ▶️ point", point);

        points.push(point);
        prevColl = coll;
        prevDebt = debt;
      }

      console.log("[useHistory] ✅ done, points:", points);
      return points;
    },
  });
}
