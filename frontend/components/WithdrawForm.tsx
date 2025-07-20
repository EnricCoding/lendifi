'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useUserPosition } from '@/hooks/useUserPosition';
import { useWithdraw } from '@/hooks/useWithdraw';
import { MARKETS } from '@/config/markets';
import { toast } from 'sonner';

const withdrawSchema = z.object({
    amount: z
        .number({ invalid_type_error: 'Amount must be a number' })
        .min(0.0001, { message: 'Enter at least 0.0001' }),
});
type WithdrawFormValues = z.infer<typeof withdrawSchema>;
type MarketKey = keyof typeof MARKETS;

interface WithdrawFormProps {
    symbol: MarketKey;
    tokenAddress: string;
    poolAddress: string;
}

export function WithdrawForm({
    symbol,
    tokenAddress,
    poolAddress,
}: WithdrawFormProps) {
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    const {
        deposited,
        borrowed,
        loading: posLoading,
    } = useUserPosition(
        poolAddress,
        tokenAddress,
        process.env.NEXT_PUBLIC_ORACLE_ADDRESS!,
    );

    const m = MARKETS[symbol];
    const factor = 10 ** m.decimals;
    const ltv = m.ltvRatio / 100; 

    const depTok = Number(deposited) / factor;
    const debtTok = Number(borrowed) / factor;

    const {
        register,
        handleSubmit,
        formState: { errors },
        watch,
        reset,
    } = useForm<WithdrawFormValues>({
        resolver: zodResolver(withdrawSchema),
        defaultValues: { amount: 0 },
    });
    const rawInput = watch('amount');
    const amountValue =
        typeof rawInput === 'number' && !isNaN(rawInput) ? rawInput : 0;
    const amountWei = BigInt(Math.floor(amountValue * factor));

    const futureHf =
        debtTok === 0
            ? Infinity
            : (depTok - amountValue) / (ltv * debtTok);

    const maxByCollateral = depTok;
    const maxByHF = debtTok === 0 ? depTok : depTok - debtTok / ltv;
    const maxWithdrawable = Math.max(0, Math.min(maxByCollateral, maxByHF));

    const { withdraw, isProcessing, isSuccess, error } = useWithdraw(tokenAddress);

    useEffect(() => {
        if (isSuccess) {
            toast.success('Withdrawal confirmed');
            reset({ amount: 0 });
        }
        if (error) toast.error('Transaction failed');
    }, [isSuccess, error, reset]);

    const onSubmit = handleSubmit(() => {
        if (
            amountValue <= 0 ||
            amountValue > maxWithdrawable ||
            futureHf < 1 ||
            isProcessing
        )
            return;

        toast('Sending transaction…', { duration: 3000 });
        withdraw(amountWei);
    });

    const formLoading = !mounted || posLoading || isProcessing;

    return (
        <form onSubmit={onSubmit} className="space-y-4 relative">
            {formLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-surface-light/60 dark:bg-surface-dark/60 rounded z-10">
                    <svg className="animate-spin h-6 w-6 text-secondary" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                    </svg>
                </div>
            )}

            <div className={formLoading ? 'pointer-events-none opacity-60' : ''}>
                <label htmlFor="amount" className="block text-sm font-medium mb-1 text-text-secondary">
                    Amount to withdraw
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
                        onClick={() => reset({ amount: parseFloat(maxWithdrawable.toFixed(2)) })}
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
                        You can withdraw up to{' '}
                        <strong>{maxWithdrawable.toFixed(2)} {symbol}</strong>{' '}
                        while keeping your Health Factor ≥ 1.
                    </p>
                )}

                {amountValue > 0 && futureHf < 1 && (
                    <p className="mt-1 text-xs text-danger">
                        This withdrawal would drop your Health Factor below 1 → the tx will fail
                    </p>
                )}
            </div>

            <button
                type="submit"
                disabled={formLoading || futureHf < 1 || amountValue <= 0}
                className="w-full flex justify-center items-center py-2 bg-primary
                   text-surface-light rounded-lg hover:bg-primary-light
                   transition disabled:opacity-50"
            >
                {isProcessing ? (
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                    </svg>
                ) : (
                    `Withdraw ${symbol}`
                )}
            </button>
        </form>
    );
}
