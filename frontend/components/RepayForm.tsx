'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useUserPosition } from '@/hooks/useUserPosition';
import { useRepay } from '@/hooks/useRepay';
import { useApprove } from '@/hooks/useApprove';
import { MARKETS } from '@/config/markets';
import { toast } from 'sonner';

const repaySchema = z.object({
    amount: z
        .number({ invalid_type_error: 'Amount must be a number' })
        .min(0.0001, { message: 'Enter at least 0.0001' }),
});
type RepayFormValues = z.infer<typeof repaySchema>;
type MarketKey = keyof typeof MARKETS;

interface RepayFormProps {
    symbol: MarketKey;
    tokenAddress: string;
    poolAddress: string;
}

export function RepayForm({
    symbol,
    tokenAddress,
    poolAddress,
}: RepayFormProps) {
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    const { borrowed, loading: posLoading } = useUserPosition(
        poolAddress,
        tokenAddress,
        process.env.NEXT_PUBLIC_ORACLE_ADDRESS!
    );

    const m = MARKETS[symbol];
    const factor = 10 ** m.decimals;
    const maxRepayable = Number(borrowed) / factor;

    const {
        register,
        handleSubmit,
        formState: { errors },
        watch,
        reset,
    } = useForm<RepayFormValues>({
        resolver: zodResolver(repaySchema),
        defaultValues: { amount: 0 },
    });

    const rawInput = watch('amount');
    const amountValue =
        typeof rawInput === 'number' && !isNaN(rawInput) ? rawInput : 0;
    const amountWei = BigInt(Math.floor(amountValue * factor));

    const { allowance = BigInt(0), approve, isApproving } = useApprove(
        tokenAddress as `0x${string}`,
        poolAddress as `0x${string}`,
        amountWei
    );

    const allowanceBigInt = BigInt((allowance ?? 0).toString());
    const needsApprove = amountWei > allowanceBigInt;

    const { repay, isProcessing, isSuccess, error } = useRepay(tokenAddress);

    useEffect(() => {
        if (isSuccess) {
            toast.success('Debt repaid');
            reset({ amount: 0 });
        }
        if (error) toast.error('Transaction failed');
    }, [isSuccess, error, reset]);

    const onSubmit = handleSubmit(() => {
        if (amountValue <= 0 || amountValue > maxRepayable) return;
        if (needsApprove) return;
        toast('Sending transaction…', { duration: 3000 });
        repay(amountWei);
    });

    const formLoading =
        !mounted || posLoading || isProcessing || isApproving;

    return (
        <form onSubmit={onSubmit} className="space-y-4 relative">
            {/* overlay spinner */}
            {formLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-surface-light/60 dark:bg-surface-dark/60 rounded z-10">
                    <svg
                        className="animate-spin h-6 w-6 text-secondary"
                        viewBox="0 0 24 24"
                    >
                        <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                        />
                        <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                        />
                    </svg>
                </div>
            )}

            <div className={formLoading ? 'pointer-events-none opacity-60' : ''}>
                <label
                    htmlFor="amount"
                    className="block text-sm font-medium mb-1 text-text-secondary"
                >
                    Amount to repay
                </label>
                <div className="relative">
                    <input
                        id="amount"
                        type="number"
                        step="any"
                        placeholder="0.0"
                        {...register('amount', { valueAsNumber: true })}
                        disabled={formLoading}
                        className="w-full pr-16 px-3 py-2 bg-surface-light dark:bg-surface-dark
                       border border-secondary-light dark:border-secondary rounded
                       focus:outline-none focus:ring-2 focus:ring-primary
                       text-text-primary dark:text-text-primary-dark"
                    />
                    <button
                        type="button"
                        onClick={() =>
                            reset({ amount: parseFloat(maxRepayable.toFixed(2)) })
                        }
                        disabled={formLoading}
                        className="absolute right-2 top-1/2 -translate-y-1/2
                       bg-secondary-light dark:bg-secondary text-xs font-medium
                       px-2 py-1 rounded hover:opacity-90"
                    >
                        MAX
                    </button>
                </div>
                {errors.amount ? (
                    <p className="mt-1 text-sm text-danger">{errors.amount.message}</p>
                ) : (
                    <p className="mt-1 text-sm text-text-secondary dark:text-text-secondary-dark">
                        Outstanding debt:{' '}
                        <strong>
                            {maxRepayable.toFixed(2)} {symbol}
                        </strong>
                    </p>
                )}
            </div>

            {needsApprove ? (
                <button
                    type="button"
                    onClick={approve}
                    disabled={formLoading}
                    className="w-full flex justify-center items-center py-2 bg-accent
                     text-surface-light rounded-lg hover:bg-accent-light
                     transition disabled:opacity-50"
                >
                    {isApproving ? (
                        <svg
                            className="animate-spin h-5 w-5"
                            viewBox="0 0 24 24"
                        >
                            <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                            />
                            <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                            />
                        </svg>
                    ) : (
                        `Approve ${symbol}`
                    )}
                </button>
            ) : (
                <button
                    type="submit"
                    disabled={
                        formLoading || amountValue <= 0 || amountValue > maxRepayable
                    }
                    className="w-full flex justify-center items-center py-2 bg-primary
                     text-surface-light rounded-lg hover:bg-primary-light
                     transition disabled:opacity-50"
                >
                    {isProcessing ? (
                        <svg
                            className="animate-spin h-5 w-5"
                            viewBox="0 0 24 24"
                        >
                            <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                            />
                            <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                            />
                        </svg>
                    ) : (
                        `Repay ${symbol}`
                    )}
                </button>
            )}
        </form>
    );
}
