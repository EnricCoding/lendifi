// frontend/components/MarketCard.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePoolData } from '@/hooks';
import { useDepositApy } from '@/hooks/useDepositApy';          // ➜ nuevo
import { Tooltip } from './ui/Tooltip';
import { MARKETS } from '@/config/markets';

/* ───────── helpers ───────── */
const fmt = (n: number, digits = 2, locale = 'es-ES') =>
    new Intl.NumberFormat(locale, {
        minimumFractionDigits: digits,
        maximumFractionDigits: digits,
    }).format(n);

interface MarketCardProps {
    symbol: keyof typeof MARKETS;
    tokenAddress: string;
    poolAddress: string;
    oracleAddress: string;
    showButton?: boolean;
}

export function MarketCard({
    symbol,
    tokenAddress,
    poolAddress,
    oracleAddress,
    showButton = true,
}: MarketCardProps) {
    /* pool info ----------------------------------------------------------- */
    const pool = usePoolData(poolAddress, tokenAddress, oracleAddress);
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    const loading = pool.isLoading;
    const error = pool.error;

    const price = pool.data?.price ?? 0;
    const totalCollateral = pool.data?.totalCollateral ?? BigInt(0);
    const totalDebt = pool.data?.totalDebt ?? BigInt(0);

    /* APY ----------------------------------------------------------------- */
    const RATE_MODEL = process.env.NEXT_PUBLIC_RATE_MODEL_ADDRESS!;
    const {
        data: apy,
        isLoading: apyLoading,
        error: apyErr,
    } = useDepositApy(RATE_MODEL, totalCollateral, totalDebt);

    /* métricas derivadas -------------------------------------------------- */
    const decimals = MARKETS[symbol].decimals;
    const tvl = Number(totalCollateral) / 10 ** decimals;
    const utilization =
        totalCollateral > BigInt(0)
            ? (Number(totalDebt) / Number(totalCollateral)) * 100
            : 0;

    /* ─────────────── JSX ─────────────── */
    return (
        <div className="
      p-4 rounded-xl shadow hover:shadow-lg transition
      border border-secondary-light dark:border-secondary
      bg-surface-light dark:bg-surface-dark">
            <h3 className="text-lg font-bold text-primary dark:text-primary-dark mb-3">
                {symbol}
            </h3>

            {/* Loader global */}
            {(!mounted || loading) && (
                <div className="flex justify-center py-5">
                    <svg className="animate-spin h-6 w-6 text-secondary dark:text-secondary-dark" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                    </svg>
                </div>
            )}

            {/* Error de pool */}
            {mounted && !loading && error && (
                <p className="text-danger text-sm">No se pudo obtener los datos del mercado.</p>
            )}

            {/* Datos */}
            {mounted && !loading && !error && (
                <div className="space-y-4">
                    {/* Precio */}
                    <div>
                        <span className="block text-sm text-text-secondary dark:text-text-secondary-dark">
                            Precio de mercado
                        </span>
                        <span className="font-medium text-primary">
                            ${fmt(price, 4)} USD
                        </span>
                    </div>

                    {/* Utilización */}
                    <div>
                        <span className="block text-sm text-text-secondary dark:text-text-secondary-dark items-center gap-1">
                            Pool prestado (Porcentaje del total depositado que está actualmente prestado)
                        </span>
                        <span className="font-medium text-primary">
                            {fmt(utilization, 1)} %
                        </span>
                    </div>

                    {/* TVL */}
                    <div>
                        <span className="block text-sm text-text-secondary dark:text-text-secondary-dark">
                            TVL (Total Locked)
                        </span>
                        <span className="font-medium text-primary">
                            {fmt(tvl)} {symbol}
                        </span>
                    </div>

                    {/* APY estimada */}
                    <div>
                        <span className="block text-sm text-text-secondary dark:text-text-secondary-dark">
                            Rentabilidad estimada
                        </span>
                        {apyErr ? (
                            <span className="text-danger text-sm">–</span>
                        ) : (
                            <span className="font-medium text-primary">
                                {apyLoading ? '…' : `${fmt(apy ?? 0, 2)} % APY`}
                            </span>
                        )}
                    </div>

                    {/* CTA opcional */}
                    {showButton && (
                        <Link
                            href={`/markets/${symbol}`}
                            className="block w-full mt-2 text-center rounded-lg py-2 bg-primary text-surface-light hover:bg-primary-light transition"
                        >
                            Gestionar mercado {symbol}
                        </Link>
                    )}
                </div>
            )}
        </div>
    );
}
