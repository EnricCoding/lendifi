'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAccount, useBalance } from 'wagmi';
import { useDeposit } from '@/hooks/useDeposit';
import { useApprove } from '@/hooks/useApprove';
import { toast } from 'sonner';

const depositSchema = z.object({
    amount: z
        .number({ invalid_type_error: 'Amount must be a number' })
        .min(0.0001, { message: 'Enter at least 0.0001' }),
});
type DepositFormValues = z.infer<typeof depositSchema>;

export function DepositForm({
    symbol,
    tokenAddress,
    poolAddress,
}: {
    symbol: string;
    tokenAddress: string;
    poolAddress: string;
}) {
    const [mounted, setMounted] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    useEffect(() => setMounted(true), []);

    const {
        register,
        handleSubmit,
        formState: { errors },
        watch,
        setValue,
        reset,
    } = useForm<DepositFormValues>({
        resolver: zodResolver(depositSchema),
        defaultValues: { amount: 0 },
    });

    const { address } = useAccount();
    const { data: balanceData, isLoading: balanceLoading } = useBalance({
        address,
        token: tokenAddress as `0x${string}`,
        query: { refetchInterval: 5_000 },
    });
    const balance = balanceData?.value ?? BigInt(0);
    const balanceDec = Number(balance) / 1e6;

    const amountValue = watch('amount') ?? 0;
    const amountWei =
        typeof amountValue === 'number' && Number.isFinite(amountValue)
            ? BigInt(Math.floor(amountValue * 1e6))
            : BigInt(0);

    const { allowance = BigInt(0), approve, isApproving } = useApprove(
        tokenAddress as `0x${string}`,
        poolAddress as `0x${string}`,
        amountWei
    );

    const allowanceBigInt = BigInt((allowance ?? 0).toString());
    const needsApprove = amountWei > allowanceBigInt;

    const { deposit, isProcessing, isSuccess, error: txError } =
        useDeposit(tokenAddress);
    useEffect(() => {
        if (isSuccess) {
            toast.success('Deposit confirmed ✅');
            reset({ amount: 0 });
        }
    }, [isSuccess, reset]);

    const loadingTx = submitting || isProcessing;
    const formLoading = !mounted || balanceLoading || isApproving || loadingTx;

    const onSubmit = handleSubmit(async () => {
        if (amountWei === BigInt(0) || amountWei > balance) return;
        toast('Sending transaction…', { duration: 3000 });
        setSubmitting(true);
        try {
            await deposit(amountWei);
        } finally {
            setSubmitting(false);
        }
    });

    return (
        <form onSubmit={onSubmit} className="space-y-4 relative">
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
                    Amount to deposit
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
                        onClick={() => setValue('amount', balanceDec)}
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
                    <p
                        className="mt-1 text-sm text-text-secondary dark:text-text-secondary-dark"
                        suppressHydrationWarning
                    >
                        Available balance:{' '}
                        {balanceLoading ? 'Loading…' : `${balanceDec.toFixed(2)} ${symbol}`}
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
                    disabled={formLoading}
                    className="w-full flex justify-center items-center py-2 bg-primary
                     text-surface-light rounded-lg hover:bg-primary-light
                     transition disabled:opacity-50"
                >
                    {loadingTx ? (
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
                        `Deposit ${symbol}`
                    )}
                </button>
            )}

            {txError && (
                <p className="mt-1 text-sm text-danger">{txError.message}</p>
            )}
        </form>
    );
}
