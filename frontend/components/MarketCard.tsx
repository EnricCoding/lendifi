// frontend/components/MarketCard.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePoolData } from '@/hooks';
import { useDepositApy } from '@/hooks/useDepositApy';
import { Tooltip } from './ui/Tooltip';

/**
 * MarketCard: información esencial para usuarios no técnicos.
 * - Precio actual del token (USD)
 * - Porcentaje del pool prestado (utilización)
 * - TVL
 * - APY real (basada en la utilización actual)
 * - CTA opcional
 */
export function MarketCard({
    symbol,
    tokenAddress,
    poolAddress,
    oracleAddress,
    showButton = true,
}: {
    symbol: string;
    tokenAddress: string;
    poolAddress: string;
    oracleAddress: string;
    showButton?: boolean;
}) {
    const pool = usePoolData(poolAddress, tokenAddress, oracleAddress);
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    const { data, isLoading, error } = pool;
    const price = data?.price ?? 0;
    const totalCollateral = data?.totalCollateral ?? BigInt(0);
    const totalDebt = data?.totalDebt ?? BigInt(0);

    /* APY real */
    const rateModelAddress = process.env.NEXT_PUBLIC_RATE_MODEL_ADDRESS!;
    const { data: apy, isLoading: apyLoading } = useDepositApy(
        rateModelAddress,
        totalCollateral,
        totalDebt
    );

    /* Métricas pool */
    const tvl = Number(totalCollateral) / 1e18;
    const utilization =
        totalCollateral > BigInt(0)
            ? (Number(totalDebt) / Number(totalCollateral)) * 100
            : 0;

    const fmt = (n: number, digits = 2) =>
        new Intl.NumberFormat('es-ES', {
            minimumFractionDigits: digits,
            maximumFractionDigits: digits,
        }).format(n);

    return (
        <div className="p-4 rounded-xl shadow hover:shadow-lg transition border border-secondary-light dark:border-secondary bg-surface-light dark:bg-surface-dark">
            {/* Encabezado */}
            <h3 className="text-lg font-bold text-primary dark:text-primary-dark mb-3">{symbol}</h3>

            {/* Loader */}
            {(!mounted || isLoading) && (
                <div className="flex justify-center py-5">
                    <svg className="animate-spin h-6 w-6 text-secondary dark:text-secondary-dark" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                    </svg>
                </div>
            )}

            {/* Error */}
            {mounted && !isLoading && error && (
                <p className="text-danger text-sm">Error al cargar datos. Recarga la página.</p>
            )}

            {/* Datos */}
            {mounted && !isLoading && !error && (
                <div className="space-y-4">
                    {/* Precio */}
                    <div>
                        <span className="block text-sm text-text-secondary dark:text-text-secondary-dark">Precio de mercado</span>
                        <span className="font-medium text-primary">${fmt(price, 4)} USD</span>
                    </div>

                    {/* Utilización */}
                    <div>
                        <span className="block text-sm text-text-secondary dark:text-text-secondary-dark items-center gap-1">
                            Pool prestado (Porcentaje del total depositado que está actualmente prestado)
                        </span>
                        <span className="font-medium text-primary">{fmt(utilization, 1)} %</span>
                    </div>

                    {/* TVL */}
                    <div>
                        <span className="block text-sm text-text-secondary dark:text-text-secondary-dark">TVL (Total Locked)</span>
                        <span className="font-medium text-primary">{fmt(tvl)} {symbol}</span>
                    </div>

                    {/* APY real */}
                    <div>
                        <span className="block text-sm text-text-secondary dark:text-text-secondary-dark">Rentabilidad estimada</span>
                        <span className="font-medium text-primary">
                            {apyLoading ? '…' : `${fmt(apy ?? 0, 2)} % APY`}
                        </span>
                        {apy === 0 && !apyLoading && (
                            <p className="text-xs text-text-secondary">Sin préstamos activos → APY 0 %</p>
                        )}
                    </div>

                    {/* CTA */}
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