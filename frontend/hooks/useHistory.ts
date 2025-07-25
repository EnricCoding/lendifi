"use client";

import { useQuery } from "@tanstack/react-query";
import { ethers, type Log, type Filter } from "ethers";
import LendingPoolAbi from "@/abis/LendingPool.json";

export type EventType = "Deposit" | "Withdraw" | "Borrow" | "Repay";
export interface Point {
  ts: number; 
  collateral: number;
  debt: number;
  event: EventType;
}

const BLOCKS_PER_DAY = 6500;

export function useHistory(
  poolAddress: string,
  tokenAddress: string,
  user: `0x${string}`,
  tokenDecimals: number,
  daysAgo = 7 
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

      const eth = (window as any).ethereum;
      if (!eth) throw new Error("No Ethereum provider");
      const provider = new ethers.BrowserProvider(eth);
      const pool = new ethers.Contract(
        poolAddress,
        LendingPoolAbi.abi,
        provider
      );

      const latest = await provider.getBlockNumber();
      const fromBlock = Math.max(0, latest - blockRange);

      const depTopics = (pool.filters.Deposit(tokenAddress, user) as any)
        .topics;
      const witTopics = (pool.filters.Withdraw(tokenAddress, user) as any)
        .topics;
      const borTopics = (pool.filters.Borrow(tokenAddress, user) as any).topics;
      const repTopics = (pool.filters.Repay(tokenAddress, user) as any).topics;

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
        try {
          return await provider.getLogs(filter);
        } catch (err: any) {
          const msg = err?.message ?? "";
          if (msg.includes("more than 10000")) {
            const mid = Math.floor((start + end) / 2);
            const left = await fetchLogsRec(topics, start, mid);
            const right = await fetchLogsRec(topics, mid + 1, end);
            return [...left, ...right];
          }
          console.error("[useHistory] getLogs error", err);
          throw err;
        }
      }

      const [dLogs, wLogs, bLogs, rLogs] = await Promise.all([
        fetchLogsRec(depTopics, fromBlock, latest),
        fetchLogsRec(witTopics, fromBlock, latest),
        fetchLogsRec(borTopics, fromBlock, latest),
        fetchLogsRec(repTopics, fromBlock, latest),
      ]);

      const allLogs = [...dLogs, ...wLogs, ...bLogs, ...rLogs].sort((a, b) => {
        if (a.blockNumber !== b.blockNumber)
          return a.blockNumber - b.blockNumber;
        return (a.transactionIndex ?? 0) - (b.transactionIndex ?? 0);
      });

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

        if (coll === prevColl && debt === prevDebt) {
          continue;
        }

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

        points.push(point);
        prevColl = coll;
        prevDebt = debt;
      }

      return points;
    },
  });
}
