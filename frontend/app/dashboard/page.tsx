// frontend/app/dashboard/page.tsx
'use client';

import React from 'react';
import { TokenCard } from '@/components/TokenCard';

// Leer variables de entorno en build time
const POOL = process.env.NEXT_PUBLIC_LENDING_POOL_ADDRESS!;
const ORACLE = process.env.NEXT_PUBLIC_ORACLE_ADDRESS!;

const MARKETS = [
    { symbol: 'USDC', tokenAddress: process.env.NEXT_PUBLIC_USDC_TOKEN_ADDRESS! },
    { symbol: 'DAI', tokenAddress: process.env.NEXT_PUBLIC_DAI_TOKEN_ADDRESS! },
] as const;

// Verificar si falta algo
const missing = [
    !POOL && 'LENDING_POOL_ADDRESS',
    !ORACLE && 'ORACLE_ADDRESS',
    ...MARKETS.map(m => (!m.tokenAddress && `${m.symbol}_TOKEN_ADDRESS`))
].filter(Boolean) as string[];

export default function DashboardPage() {
    if (missing.length > 0) {
        return (
            <div className="flex items-center justify-center h-screen bg-bg-light dark:bg-bg-dark px-4">
                <div className="text-center">
                    <h2 className="text-2xl font-semibold text-text-primary dark:text-text-primary-dark mb-2">
                        Dashboard no configurado
                    </h2>
                    <p className="text-text-secondary dark:text-text-secondary-dark">
                        Faltan variables de entorno para: {missing.join(', ')}
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-bg-light dark:bg-bg-dark px-4 py-6">
            <h1 className="text-3xl font-bold text-text-primary dark:text-text-primary-dark mb-4">
                Dashboard de Mercados
            </h1>
            <p className="text-text-secondary dark:text-text-secondary-dark mb-6">
                Bienvenido a tu panel de posiciones. Aquí puedes ver en tiempo real cuánto has depositado,
                cuál es tu deuda y tu Health Factor en cada mercado, para gestionar mejor tu riesgo.
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
