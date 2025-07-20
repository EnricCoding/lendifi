// frontend/components/TokenCard.tsx
'use client';

import { useState, useEffect } from 'react';
import { usePoolData, useUserPosition } from '@/hooks';

interface TokenCardProps {
  symbol: string;
  tokenAddress: string;
  poolAddress: string;
  oracleAddress: string;
  showUserData?: boolean;
}

export function TokenCard({
  symbol,
  tokenAddress,
  poolAddress,
  oracleAddress,
  showUserData = true,
}: TokenCardProps) {
  const pool = usePoolData(poolAddress, tokenAddress, oracleAddress);
  const user = useUserPosition(poolAddress, tokenAddress, oracleAddress);

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const loading = pool.isLoading || (showUserData && user.isLoading);
  const error = pool.error || (showUserData && user.error);

  const collateral = user.data?.collateralValue ?? 0;
  const debt = user.data?.debtValue ?? 0;
  const hf = user.data?.healthFactor ?? Infinity;

  const price = pool.data?.price ?? 0;
  const totalCollateral = pool.data?.totalCollateral ?? BigInt(0);
  const totalDebt = pool.data?.totalDebt ?? BigInt(0);
  const rawRayRate = pool.data?.borrowApr ?? BigInt(0);  // ray/sec from your hook
  const rawSupplyRate = pool.data?.depositApy ?? BigInt(0);  // ray/sec

  // convert ray/sec → annual %:
  const secondsPerYear = 31_536_000;
  const aprDecimal = (Number(rawRayRate) / 1e27) * secondsPerYear;
  const apyDecimal = (Number(rawSupplyRate) / 1e27) * secondsPerYear;
  const aprPercent = aprDecimal * 100;
  const apyPercent = apyDecimal * 100;

  const utilization =
    totalCollateral > BigInt(0)
      ? (Number(totalDebt) / Number(totalCollateral)) * 100
      : 0;

  // Health-factor classes
  let hfClass = 'text-gray-700 dark:text-gray-300';
  if (hf <= 1) hfClass = 'text-yellow-600 dark:text-yellow-400';
  if (hf < 1) hfClass = 'text-red-600   dark:text-red-400';

  return (
    <div className="p-6 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 shadow-md space-y-4 text-gray-900 dark:text-gray-100">
      <h3 className="text-xl font-semibold">{symbol}</h3>

      {(!mounted || loading) && (
        <div className="flex flex-col items-center space-y-2">
          <div className="w-6 h-6 border-4 border-t-indigo-600 border-gray-200 rounded-full animate-spin" />
          <p className="text-gray-600 dark:text-gray-400">Loading data…</p>
        </div>
      )}

      {mounted && !loading && error && (
        <p className="text-red-600">Error loading {symbol}</p>
      )}

      {mounted && !loading && !error && (
        <>
          {/* Price */}
          <div>
            <p className="text-gray-600 dark:text-gray-400">Price</p>
            <p className="font-medium text-primary">
              ${price.toFixed(2)} USD
            </p>
          </div>

          {/* Utilization */}
          <div>
            <p className="text-gray-600 dark:text-gray-400">Utilization</p>
            <p className="font-medium text-primary">
              {utilization.toFixed(2)}%
            </p>
          </div>

          {/* Borrow APR */}
          <div>
            <p className="text-gray-600 dark:text-gray-400">Borrow APR</p>
            <p className="font-medium text-primary">
              {aprPercent.toFixed(2)}%
            </p>
          </div>

          {/* Deposit APY */}
          <div>
            <p className="text-gray-600 dark:text-gray-400">Deposit APY</p>
            <p className="font-medium text-primary">
              {apyPercent.toFixed(2)}%
            </p>
          </div>

          {showUserData && (
            <>
              <div>
                <p className="text-gray-600 dark:text-gray-400">Collateral</p>
                <p className="font-medium text-primary">
                  ${collateral.toFixed(2)}
                </p>
              </div>

              <div>
                <p className="text-gray-600 dark:text-gray-400">Debt</p>
                <p className="font-medium text-primary">
                  ${debt.toFixed(2)}
                </p>
              </div>

              <div>
                <p className="text-gray-600 dark:text-gray-400">Health Factor</p>
                <p className={`${hfClass} font-medium text-primary`}>
                  {isFinite(hf) ? hf.toFixed(2) : '∞'}
                </p>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
