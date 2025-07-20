'use client';

import React from 'react';
import { TokenCard } from '@/components/TokenCard';

const POOL = process.env.NEXT_PUBLIC_LENDING_POOL_ADDRESS!;
const ORACLE = process.env.NEXT_PUBLIC_ORACLE_ADDRESS!;

const MARKETS = [
    { symbol: 'USDC', tokenAddress: process.env.NEXT_PUBLIC_USDC_TOKEN_ADDRESS! },
    { symbol: 'DAI', tokenAddress: process.env.NEXT_PUBLIC_DAI_TOKEN_ADDRESS! },
] as const;

export default function DashboardPage() {
    return (
        <div className="min-h-screen bg-bg-light dark:bg-bg-dark px-4 py-6">
            <h1 className="text-3xl font-bold text-text-primary dark:text-text-primary-dark mb-4">
                Markets Dashboard
            </h1>
            <p className="text-text-secondary dark:text-text-secondary-dark mb-6">
                These are the tokens currently available on LendiFi.
            </p>
            <p className="text-text-secondary dark:text-text-secondary-dark mb-6">
                Monitor your collateral, outstanding debt and health factor for every market—all updated in real time.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {MARKETS.map(({ symbol, tokenAddress }) => (
                    <TokenCard
                        key={symbol}
                        symbol={symbol}
                        poolAddress={POOL}
                        oracleAddress={ORACLE}
                        tokenAddress={tokenAddress}
                        showUserData={true}
                    />
                ))}
            </div>
        </div>
    );
}
