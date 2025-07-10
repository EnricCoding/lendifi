// frontend/components/MarketCard.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePoolData } from '@/hooks';
import { Tooltip } from './ui/Tooltip';

/* ───────── helpers ───────── */
function fmt(
    n: number,
    digits = 2,
    locale = 'es-ES'
) {
    return new Intl.NumberFormat(locale, {
        minimumFractionDigits: digits,
        maximumFractionDigits: digits,
    }).format(n);
}

interface MarketCardProps {
    symbol: string;
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
    const pool = usePoolData(poolAddress, tokenAddress, oracleAddress);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const loading = pool.isLoading;
    const error = pool.error;

    const price = pool.data?.price ?? 0;
    const totalCollateral = pool.data?.totalCollateral ?? BigInt(0);
    const totalDebt = pool.data?.totalDebt ?? BigInt(0);

    const tvl = Number(totalCollateral) / 1e18;                    // en tokens

    const utilization =
        totalCollateral > BigInt(0)
            ? (Number(totalDebt) / Number(totalCollateral)) * 100
            : 0;

    return (
        <div className="
      p-4 rounded-xl shadow hover:shadow-lg transition
      border border-secondary-light dark:border-secondary
      bg-surface-light dark:bg-surface-dark"
        >
            <h3 className="text-lg font-bold text-primary dark:text-primary-dark mb-3">
                {symbol}
            </h3>

            {/* Loader */}
            {(!mounted || loading) && (
                <div className="flex justify-center py-5">
                    <svg className="animate-spin h-6 w-6 text-secondary dark:text-secondary-dark" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                    </svg>
                </div>
            )}

            {/* Error */}
            {mounted && !loading && error && (
                <p className="text-danger text-sm">No se pudo obtener los datos del mercado.</p>
            )}

            {/* Datos */}
            {mounted && !loading && !error && (
                <div className="space-y-3">
                    {/* Precio */}
                    <div className="flex items-baseline gap-2">
                        <span className="text-sm text-text-secondary dark:text-text-secondary-dark">
                            Precio
                        </span>
                        <span className="font-medium text-primary">
                            ${fmt(price, 4)} USD
                        </span>
                    </div>

                    {/* Utilización */}
                    <div className="flex items-baseline gap-2">
                        <span className="text-sm text-text-secondary dark:text-text-secondary-dark flex items-center gap-1">
                            Utilización
                            <Tooltip content="Porcentaje de deuda respecto al colateral total">
                                <span className="cursor-help text-secondary dark:text-secondary-dark">ℹ️</span>
                            </Tooltip>
                        </span>
                        <span className="font-medium text-primary">
                            {fmt(utilization, 1)}%
                        </span>
                    </div>

                    {/* TVL */}
                    <div className="flex items-baseline gap-2">
                        <span className="text-sm text-text-secondary dark:text-text-secondary-dark">
                            TVL
                        </span>
                        <span className="font-medium text-primary">
                            {fmt(tvl)} {symbol}
                        </span>
                    </div>

                    {/* CTA */}
                    {showButton && (
                        <Link
                            href={`/markets/${symbol}`}
                            className="
                block w-full mt-2 text-center rounded-lg
                py-2 bg-primary text-surface-light
                hover:bg-primary-light transition"
                        >
                            Detalles &rarr;
                        </Link>
                    )}
                </div>
            )}
        </div>
    );
}
