// frontend/app/markets/[symbol]/page.tsx
'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { MARKETS } from '@/config/markets';
import { MarketCard } from '@/components/MarketCard';
import { DepositForm } from '@/components/DepositForm';
import { UserPositionCard } from '@/components/UserPositionCard';
import { useUserPosition } from '@/hooks';
import { BorrowForm } from '@/components/BorrowForm';
import { WithdrawForm } from '@/components/WithdrawForm';
import { RepayForm } from '@/components/RepayForm';

export default function MarketDetailPage() {
    // 1) Leer el parámetro dinámico desde useParams (app router)
    const params = useParams();
    const symbol = (Array.isArray(params?.symbol) ? params.symbol[0] : params?.symbol ?? '').toUpperCase();

    // 2) Buscar la configuración de este mercado
    const cfg = MARKETS[symbol as keyof typeof MARKETS];
    if (!cfg) {
        return (
            <div className="p-6 text-center">
                🚫 Mercado “{symbol}” no encontrado.
            </div>
        );
    }

    const POOL = process.env.NEXT_PUBLIC_LENDING_POOL_ADDRESS!;
    const ORACLE = process.env.NEXT_PUBLIC_ORACLE_ADDRESS!;

    const {
        deposited,        // bigint  (cantidad en wei)
        borrowed,         // bigint  (cantidad en wei)
        healthFactor,     // number
        loading: posLoading,
    } = useUserPosition(
        POOL,                 // poolAddress
        cfg.tokenAddress,     // tokenAddress
        ORACLE                // oracleAddress
    );

    console.log("[MarketDetailPage] User position:", {
        deposited,
        borrowed,
        healthFactor,
    });


    // 3) Variables de entorno


    return (
        <div className="min-h-screen bg-bg-light dark:bg-bg-dark px-10 py-6 space-y-8">
            {/* Header */}
            <div className="space-y-2">
                <h1 className="text-3xl font-bold text-primary dark:text-primary-dark">
                    {cfg.symbol} Market
                </h1>
                <p className="text-text-secondary dark:text-text-secondary-dark">
                    Aquí puedes ver el estado actual del mercado y tu posición personal. Revisa tu Health Factor y realiza operaciones de depósito, préstamo, retiro y repago.
                </p>
            </div>

            {/* Market overview */}
            <MarketCard
                symbol={cfg.symbol}
                tokenAddress={cfg.tokenAddress}
                poolAddress={POOL}
                oracleAddress={ORACLE}
                showButton={false} // No mostrar botón aquí, ya que es una vista de detalle
            />

            {/* 🆕 5) Tu posición */}


            <UserPositionCard
                depositedWei={deposited}
                borrowedWei={borrowed}
                hf={healthFactor}
                symbol={cfg.symbol}
                loading={posLoading}
            />

            {/* Actions */}
            <div className="space-y-6">
                <h2 className="text-2xl font-semibold text-primary dark:text-primary-dark">
                    Acciones disponibles
                </h2>
                <p className="text-text-secondary dark:text-text-secondary-dark">
                    Selecciona una acción para interactuar con el protocolo. Asegúrate de tener fondos suficientes y revisa las instrucciones de cada operación.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 auto-rows-fr">
                    {/* Deposit */}
                    <div className="bg-surface-light dark:bg-surface-dark p-6 rounded-lg shadow-md flex flex-col h-full">
                        <h3 className="text-xl font-semibold mb-2 text-secondary">
                            Depositar {cfg.symbol}
                        </h3>
                        <p className="text-text-secondary dark:text-text-secondary-dark text-sm mb-4">
                            Usa tus {cfg.symbol} como garantía: deposítalos aquí para empezar a generar intereses y desbloquear tu capacidad de préstamo.
                        </p>
                        <DepositForm tokenAddress={cfg.tokenAddress} poolAddress={POOL} symbol={cfg.symbol} />
                    </div>

                    {/* Borrow */}
                    <div className="bg-surface-light dark:bg-surface-dark p-6 rounded-lg shadow-md flex flex-col h-full">
                        <h3 className="text-xl font-semibold mb-2 text-secondary">
                            Pedir prestado {cfg.symbol}
                        </h3>
                        <p className="text-text-secondary dark:text-text-secondary-dark text-sm mb-4">
                            Aquí puedes pedir prestado hasta el máximo disponible en función de tu colateral y LTV (80%).
                        </p>
                        <BorrowForm
                            symbol={cfg.symbol}
                            tokenAddress={cfg.tokenAddress}
                            poolAddress={POOL}
                        />
                    </div>

                    {/* Withdraw */}
                    <div className="bg-surface-light dark:bg-surface-dark p-6 rounded-lg shadow-md flex flex-col h-full">
                        <h3 className="text-xl font-semibold mb-2 text-secondary">
                            Retirar {cfg.symbol}
                        </h3>
                        <p className="text-text-secondary dark:text-text-secondary-dark text-sm mb-4">
                            Retira tu colateral quemando aTokens. Asegúrate de mantener tu Health Factor por encima de 1.
                        </p>

                        <WithdrawForm
                            symbol={cfg.symbol}
                            tokenAddress={cfg.tokenAddress}
                            poolAddress={POOL}
                        />
                        {/* Aquí irá <WithdrawForm /> una vez implementado */}
                    </div>

                    {/* Repay */}
                    <div className="bg-surface-light dark:bg-surface-dark p-6 rounded-lg shadow-md flex flex-col h-full">
                        <h3 className="text-xl font-semibold mb-2 text-secondary">
                            Reembolsar {cfg.symbol}
                        </h3>
                        <p className="text-text-secondary dark:text-text-secondary-dark text-sm mb-4">
                            Paga tu deuda en {cfg.symbol}. Esto incrementa tu Health Factor y reduce el riesgo.
                        </p>
                        <RepayForm
                            symbol={cfg.symbol as any}          // MarketKey
                            tokenAddress={cfg.tokenAddress}
                            poolAddress={POOL}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
