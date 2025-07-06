// frontend/app/markets/page.tsx
'use client';

import React from 'react';
import { MARKETS } from '@/config/markets';
import { MarketCard } from '@/components/MarketCard';

const POOL = process.env.NEXT_PUBLIC_LENDING_POOL_ADDRESS!;
const ORACLE = process.env.NEXT_PUBLIC_ORACLE_ADDRESS!;

export default function MarketsPage() {
    return (
        <div className="min-h-screen bg-bg-light dark:bg-bg-dark px-4 py-6">
            <h1 className="text-3xl font-bold text-text-primary dark:text-text-primary-dark mb-4">
                Mercados Disponibles
            </h1>
            <p className="text-text-secondary dark:text-text-secondary-dark mb-6">
                Explora los mercados disponibles. Aquí puedes ver el precio actual y la utilización de cada token.
                Haz clic en "Ver detalles" para gestionar depósitos, préstamos y repagos.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Object.values(MARKETS).map(({ symbol, tokenAddress }) => (
                    <div key={symbol} className="group">
                        <MarketCard
                            symbol={symbol}
                            poolAddress={POOL}
                            oracleAddress={ORACLE}
                            tokenAddress={tokenAddress}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
}
