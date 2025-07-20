'use client';

import React from 'react';
import { MARKETS } from '@/config/markets';
import { MarketCard } from '@/components/MarketCard';

const POOL = process.env.NEXT_PUBLIC_LENDING_POOL_ADDRESS!;
const ORACLE = process.env.NEXT_PUBLIC_ORACLE_ADDRESS!;

export default function MarketsPage() {
    return (
        <div className="min-h-screen bg-bg-light dark:bg-bg-dark px-6 py-6">
            <h1 className="text-3xl font-bold text-text-primary dark:text-text-primary-dark mb-4">
                Available Markets
            </h1>
            <p className="text-text-secondary dark:text-text-secondary-dark mb-6">
                Explore the available markets. Here you can see each token&#39;s current price and utilisation.
                Click &quot;View details&quot; to manage deposits, borrows and repayments.
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
