// frontend/components/BorrowForm.tsx
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useUserPosition } from '@/hooks/useUserPosition';
import { useBorrow } from '@/hooks/useBorrow';
import { MARKETS } from '@/config/markets';
import { toast } from 'sonner';

/* ───────── esquema ───────── */
const borrowSchema = z.object({
    amount: z
        .number({ invalid_type_error: 'La cantidad debe ser un número' })
        .min(0.0001, { message: 'Introduce al menos 0.0001' }),
});
type BorrowFormValues = z.infer<typeof borrowSchema>;
type MarketKey = keyof typeof MARKETS;

interface BorrowFormProps {
    symbol: MarketKey;
    tokenAddress: string;
    poolAddress: string;
}

export function BorrowForm({ symbol, tokenAddress, poolAddress }: BorrowFormProps) {
    /* montar */
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    /* datos on-chain */
    const { deposited, borrowed, loading: posLoading } = useUserPosition(
        poolAddress,
        tokenAddress,
        process.env.NEXT_PUBLIC_ORACLE_ADDRESS!
    );

    /* config mercado */
    const m = MARKETS[symbol];
    const factor = 10 ** m.decimals;
    const maxBorrowable =
        mounted && !posLoading
            ? (Number(deposited) / factor) * (m.ltvRatio / 100) - Number(borrowed) / factor
            : 0;

    /* react-hook-form */
    const {
        register,
        handleSubmit,
        formState: { errors },
        watch,
        reset,
    } = useForm<BorrowFormValues>({
        resolver: zodResolver(borrowSchema),
        defaultValues: { amount: 0 },
    });
    const rawInput = watch('amount');
    const amountValue = typeof rawInput === 'number' && !isNaN(rawInput) ? rawInput : 0;
    const amountWei = BigInt(Math.floor(amountValue * factor));

    /* hook borrow */
    const { borrow, isProcessing, isSuccess, error } = useBorrow(tokenAddress);

    /* toast side-effects */
    useEffect(() => {
        if (isSuccess) {
            toast.success('Préstamo confirmado');
            reset({ amount: 0 });
        }
        if (error) toast.error('La transacción falló');
    }, [isSuccess, error, reset]);

    /* submit */
    const onSubmit = handleSubmit(() => {
        if (amountValue <= 0 || amountValue > maxBorrowable) return;
        toast('Enviando transacción…', { duration: 3000 });
        borrow(amountWei);
    });

    /* flag general de carga */
    const formLoading = !mounted || posLoading || isProcessing;

    return (
        <form onSubmit={onSubmit} className="space-y-4 relative">
            {/* overlay spinner mientras carga */}
            {formLoading && (
                <div className="absolute inset-0 flex justify-center items-center bg-surface-light/60 dark:bg-surface-dark/60 rounded-lg z-10">
                    <svg className="animate-spin h-6 w-6 text-secondary" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                    </svg>
                </div>
            )}

            {/* input cantidad */}
            <div className={formLoading ? 'pointer-events-none opacity-60' : ''}>
                <label htmlFor="amount" className="block text-sm font-medium mb-1">
                    Cantidad a pedir prestado
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
                        onClick={() => reset({ amount: parseFloat(maxBorrowable.toFixed(2)) })}
                        disabled={formLoading}
                        className="absolute right-2 top-1/2 -translate-y-1/2
                       bg-secondary-light dark:bg-secondary text-xs font-medium
                       px-2 py-1 rounded hover:opacity-90"
                    >
                        MAX
                    </button>
                </div>

                {errors.amount && (
                    <p className="mt-1 text-sm text-danger">{errors.amount.message}</p>
                )}
                <p className="text-sm text-text-secondary dark:text-text-secondary-dark">
                    Puedes pedir hasta{' '}
                    <strong>
                        {maxBorrowable.toFixed(2)} {symbol}
                    </strong>{' '}
                    (LTV {m.ltvRatio}%).
                </p>
            </div>

            {/* botón submit */}
            <button
                type="submit"
                disabled={formLoading}
                className="w-full flex justify-center items-center py-2 bg-primary
                   text-surface-light rounded-lg hover:bg-primary-light
                   transition disabled:opacity-50"
            >
                {isProcessing ? (
                    <svg className="animate-spin h-5 w-5 text-surface-light" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                    </svg>
                ) : (
                    `Pedir prestado ${symbol}`
                )}
            </button>
        </form>
    );
}
