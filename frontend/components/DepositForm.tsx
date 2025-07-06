'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAccount, useBalance } from 'wagmi';
import { useDeposit } from '@/hooks/useDeposit';
import { useApprove } from '@/hooks/useApprove';
import { useEffect, useState } from 'react';

const depositSchema = z.object({
    amount: z
        .number({ invalid_type_error: 'La cantidad debe ser un número' })
        .min(0.0001, { message: 'Introduce al menos 0.0001' }),
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

    /* ─────────────── balance del usuario (con auto-refresh) ─────────────── */
    const { address } = useAccount();
    const {
        data: balanceData,
        isLoading: balanceLoading,
        isRefetching: balanceRefetching,   // opcional: lo puedes usar si quieres otro loader
    } = useBalance({
        address,
        token: tokenAddress as `0x${string}`,
        /** refetchInterval en ms → cada ~12 s (≈ un bloque de Sepolia) */
        query: { refetchInterval: 5_000 },
    });
    const balance = balanceData?.value ?? BigInt(0);
    const balanceDec = Number(balance) / 1e6;          // USDC ⇒ 6 decimales

    /* ─────────────── cantidad introducida (wei 6 dec) ─────────────── */
    const amountValue = watch('amount') ?? 0;
    const amountWei =
        typeof amountValue === 'number' && Number.isFinite(amountValue)
            ? BigInt(Math.floor(amountValue * 1e6))
            : BigInt(0);

    /* ─────────────── approve (si es necesario) ─────────────── */
    const {
        allowance = BigInt(0),
        approve,
        isApproving,
    } = useApprove(
        tokenAddress as `0x${string}`,
        poolAddress as `0x${string}`,
        amountWei,
    );

    const allowanceBigInt = BigInt((allowance ?? 0).toString());

    const needsApprove = amountWei > allowanceBigInt;


    /* ─────────────── depositar ─────────────── */
    const {
        deposit,
        isProcessing,
        isSuccess,
        error: txError,
    } = useDeposit(tokenAddress);

    useEffect(() => {
        if (isSuccess) {
            console.log('[DepositForm] ✅ Depósito confirmado');
            reset();
        }
    }, [isSuccess, reset]);


    const onSubmit = handleSubmit(async () => {
        if (amountWei === BigInt(0) || amountWei > balance) return;
        setSubmitting(true);                    // 🔄 start loader
        try {
            await deposit(amountWei);
            console.log(`[DepositForm] Enviando depósito de ${amountWei} wei`);
            // Aquí podrías mostrar un mensaje de éxito o redirigir al usuario

        } catch (error) {
            console.error('[DepositForm] Error al depositar:', error);
            setSubmitting(false);                 // 🔄 stop loader
            throw error;                          // opcional: para manejar el error en el UI
        } finally {
            setSubmitting(false);                 // 🔄 stop loader
        }
    });
    const loading = submitting || isProcessing;

    const handleMax = () => setValue('amount', balanceDec);

    /* ─────────────── JSX ─────────────── */
    return (
        <form onSubmit={onSubmit} className="space-y-4">
            {/* ----- input ----- */}
            <div>
                <label htmlFor="amount" className="block text-sm font-medium text-text-secondary dark:text-text-secondary-dark mb-1">
                    Cantidad a depositar
                </label>
                <div className="relative">
                    <input
                        id="amount"
                        type="number"
                        step="any"
                        placeholder="0.0"
                        {...register('amount', { valueAsNumber: true })}
                        disabled={!mounted || loading || balanceLoading || isApproving}
                        className="
              w-full pr-16 px-3 py-2
              bg-surface-light dark:bg-surface-dark
              border border-secondary-light dark:border-secondary
              rounded focus:outline-none focus:ring-2 focus:ring-primary
              text-text-primary dark:text-text-primary-dark
              placeholder-text-secondary dark:placeholder-text-secondary-dark
            "
                    />
                    <button
                        type="button"
                        onClick={handleMax}
                        disabled={!mounted || loading || balanceLoading || isApproving}
                        className="absolute right-2 top-1/2 -translate-y-1/2 bg-secondary-light dark:bg-secondary text-xs font-medium px-2 py-1 rounded hover:opacity-90"
                    >
                        MAX
                    </button>
                </div>

                {errors.amount ? (
                    <p className="mt-1 text-sm text-danger">{errors.amount.message}</p>
                ) : (
                    <p className="mt-1 text-sm text-text-secondary dark:text-text-secondary-dark" suppressHydrationWarning>
                        Balance disponible:{' '}
                        {!mounted || balanceLoading ? 'Cargando…' : `${balanceDec.toFixed(2)} ${symbol}`}
                    </p>
                )}
            </div>

            {/* ----- approve / deposit ----- */}
            {needsApprove ? (
                <button
                    type="button"
                    onClick={approve}
                    disabled={isApproving || loading}
                    className="w-full flex justify-center items-center py-2 bg-accent text-surface-light rounded-lg hover:bg-accent-light transition disabled:opacity-50"
                >
                    {isApproving ? (
                        <svg className="animate-spin h-5 w-5 text-surface-light" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                        </svg>
                    ) : (
                        `Aprobar ${symbol}`
                    )}
                </button>
            ) : (
                <button
                    type="submit"
                    disabled={loading || isApproving}
                    className="w-full flex justify-center items-center py-2 bg-primary text-surface-light rounded-lg hover:bg-primary-light transition disabled:opacity-50"
                >
                    {loading ? (
                        <svg className="animate-spin h-5 w-5 text-surface-light" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                        </svg>
                    ) : (
                        `Depositar ${symbol}`
                    )}
                </button>
            )}

            {txError && <p className="mt-1 text-sm text-danger">{txError.message}</p>}
        </form>
    );
}
