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
    const params = useParams();
    const symbol = (
        Array.isArray(params?.symbol) ? params.symbol[0] : params?.symbol ?? ''
    ).toUpperCase();

    const cfg = MARKETS[symbol as keyof typeof MARKETS];
    if (!cfg) {
        return (
            <div className="p-6 text-center">
                🚫 Market “{symbol}” not found.
            </div>
        );
    }

    const POOL = process.env.NEXT_PUBLIC_LENDING_POOL_ADDRESS!;
    const ORACLE = process.env.NEXT_PUBLIC_ORACLE_ADDRESS!;

    const {
        deposited,  
        borrowed,   
        healthFactor,
        loading: posLoading,
    } = useUserPosition(POOL, cfg.tokenAddress, ORACLE);

    return (
        <div className="min-h-screen bg-bg-light dark:bg-bg-dark px-10 py-6 space-y-8">
            <div className="space-y-2">
                <h1 className="text-3xl font-bold text-primary dark:text-primary-dark">
                    {cfg.symbol} Market
                </h1>
                <p className="text-text-secondary dark:text-text-secondary-dark">
                    View the current market state and your personal position. Check your Health Factor and perform deposit, borrow, withdraw and repay operations.
                </p>
            </div>

            <MarketCard
                symbol={cfg.symbol}
                tokenAddress={cfg.tokenAddress}
                poolAddress={POOL}
                oracleAddress={ORACLE}
                showButton={false}
            />

            <UserPositionCard
                depositedWei={deposited}
                borrowedWei={borrowed}
                hf={healthFactor}
                symbol={cfg.symbol}
                loading={posLoading}
            />

            <div className="space-y-6">
                <h2 className="text-2xl font-semibold text-primary dark:text-primary-dark">
                    Available actions
                </h2>
                <p className="text-text-secondary dark:text-text-secondary-dark">
                    Select an action to interact with the protocol. Make sure you have sufficient funds and review each operation’s instructions.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 auto-rows-fr">
                    {/* Deposit */}
                    <div className="bg-surface-light dark:bg-surface-dark p-6 rounded-lg shadow-md flex flex-col h-full">
                        <h3 className="text-xl font-semibold mb-2 text-secondary">
                            Deposit {cfg.symbol}
                        </h3>
                        <p className="text-text-secondary dark:text-text-secondary-dark text-sm mb-4">
                            Use your {cfg.symbol} as collateral: deposit here to start earning interest and unlock borrowing power.
                        </p>
                        <DepositForm
                            tokenAddress={cfg.tokenAddress}
                            poolAddress={POOL}
                            symbol={cfg.symbol}
                        />
                    </div>

                    <div className="bg-surface-light dark:bg-surface-dark p-6 rounded-lg shadow-md flex flex-col h-full">
                        <h3 className="text-xl font-semibold mb-2 text-secondary">
                            Borrow {cfg.symbol}
                        </h3>
                        <p className="text-text-secondary dark:text-text-secondary-dark text-sm mb-4">
                            Borrow up to the maximum available based on your collateral and the 80 % LTV.
                        </p>
                        <BorrowForm
                            symbol={cfg.symbol}
                            tokenAddress={cfg.tokenAddress}
                            poolAddress={POOL}
                        />
                    </div>

                    <div className="bg-surface-light dark:bg-surface-dark p-6 rounded-lg shadow-md flex flex-col h-full">
                        <h3 className="text-xl font-semibold mb-2 text-secondary">
                            Withdraw {cfg.symbol}
                        </h3>
                        <p className="text-text-secondary dark:text-text-secondary-dark text-sm mb-4">
                            Withdraw your collateral by burning aTokens. Keep your Health Factor above 1.
                        </p>
                        <WithdrawForm
                            symbol={cfg.symbol}
                            tokenAddress={cfg.tokenAddress}
                            poolAddress={POOL}
                        />
                    </div>

                    <div className="bg-surface-light dark:bg-surface-dark p-6 rounded-lg shadow-md flex flex-col h-full">
                        <h3 className="text-xl font-semibold mb-2 text-secondary">
                            Repay {cfg.symbol}
                        </h3>
                        <p className="text-text-secondary dark:text-text-secondary-dark text-sm mb-4">
                            Pay back your {cfg.symbol} debt. This raises your Health Factor and reduces risk.
                        </p>
                        <RepayForm
                            symbol={cfg.symbol as any}
                            tokenAddress={cfg.tokenAddress}
                            poolAddress={POOL}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
