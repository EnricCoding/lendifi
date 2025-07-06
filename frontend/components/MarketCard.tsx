// frontend/components/MarketCard.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePoolData } from '@/hooks';
import { Tooltip } from './ui/Tooltip';

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
    const utilization =
        totalCollateral > BigInt(0)
            ? (Number(totalDebt) / Number(totalCollateral)) * 100
            : 0;

    return (
        <div className="p-4 border border-secondary-light dark:border-secondary rounded-lg bg-surface-light dark:bg-surface-dark shadow hover:shadow-lg transition">
            <h3 className="text-xl font-semibold mb-2 text-primary dark:text-primary-dark">{symbol}</h3>

            {(!mounted || loading) && (
                <div className="flex items-center justify-center py-6">
                    <div className="w-8 h-8 border-4 border-secondary-light dark:border-secondary rounded-full border-t-transparent animate-spin"></div>
                </div>
            )}

            {mounted && !loading && error && (
                <p className="text-danger">No se pudo obtener información del mercado.</p>
            )}

            {mounted && !loading && !error && (
                <div className="space-y-4">
                    <div>
                        <p className="text-text-secondary dark:text-text-secondary-dark text-sm">Precio actual</p>
                        <p className="font-medium text-primary">${price.toFixed(4)} USD</p>
                    </div>

                    <div>
                        <p className="text-text-secondary dark:text-text-secondary-dark text-sm">Utilización del pool</p>
                        <div className="flex items-center">
                            <p className="font-medium mr-1 text-primary">{utilization.toFixed(1)}%</p>
                            <Tooltip content="Porcentaje de deuda sobre colateral total">
                                <span className="cursor-help text-secondary dark:text-secondary-dark">ℹ️</span>
                            </Tooltip>
                        </div>
                    </div>

                    <div>
                        <p className="text-text-secondary dark:text-text-secondary-dark text-sm">TVL (colateral total)</p>
                        <p className="font-medium text-primary">{(Number(totalCollateral) / 1e18).toFixed(2)} tokens</p>
                    </div>

                    {showButton && (
                        <div className="mt-4">
                            <Link
                                href={`/markets/${symbol}`}
                                className="block w-full text-center py-2 bg-primary text-surface-light rounded-lg hover:bg-primary-light transition"
                            >
                                Ver detalles de {symbol}
                            </Link>
                        </div>
                    )}

                </div>
            )}
        </div>
    );
}
