// frontend/lib/contracts.ts

import { createPublicClient, http } from "viem";
import { sepolia } from "viem/chains";
import type { Abi } from "abitype";
import LendingPoolJson from "../abis/LendingPool.json";
import PriceOracleJson from "../abis/PriceOracle.json";

// ───── Validar variables de entorno ─────
const LENDING_POOL_ADDRESS = process.env
  .NEXT_PUBLIC_LENDING_POOL_ADDRESS as `0x${string}`;
if (!LENDING_POOL_ADDRESS) {
  throw new Error(
    "Missing NEXT_PUBLIC_LENDING_POOL_ADDRESS in .env.local"
  );
}

const ORACLE_ADDRESS = process.env
  .NEXT_PUBLIC_ORACLE_ADDRESS as `0x${string}`;
if (!ORACLE_ADDRESS) {
  throw new Error("Missing NEXT_PUBLIC_ORACLE_ADDRESS in .env.local");
}

const RPC_URL = process.env.NEXT_PUBLIC_SEPOLIA_RPC;
if (!RPC_URL) {
  throw new Error("Missing NEXT_PUBLIC_SEPOLIA_RPC in .env.local");
}

// ───── Cliente público sólo lectura ─────
export const publicClient = createPublicClient({
  chain: sepolia,
  transport: http(RPC_URL),
});

// ───── Helper para llamadas readContract ─────
function makeReadContract<TReturn>(
  abi: Abi,
  address: `0x${string}`
) {
  return async (config: {
    functionName: string;
    args?: any[];
  }): Promise<TReturn> => {
    console.log(`[contracts] call ${config.functionName} on ${address}`, {
      args: config.args,
    });
    const result = await publicClient.readContract({
      address,
      abi,
      ...config,
    }) as TReturn;
    console.log(`[contracts] result ${config.functionName}`, result);
    return result;
  };
}

// ───── Instancias de sólo lectura ─────
export const LendingPool = {
  read: makeReadContract<
    // para getReserveData: devuelve un objeto con estos campos
    {
      totalCollateral: bigint;
      totalDebt: bigint;
      borrowIndex: bigint;
      lastUpdate: number;
    }
  >(LendingPoolJson.abi as Abi, LENDING_POOL_ADDRESS),
};

export const PriceOracle = {
  read: makeReadContract<[bigint, number]>(
    PriceOracleJson.abi as Abi,
    ORACLE_ADDRESS
  ),
};
