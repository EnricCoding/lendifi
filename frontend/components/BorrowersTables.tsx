// frontend/components/BorrowersTable.tsx
'use client';

import { useState } from 'react';
import { useLiquidate } from '@/hooks/useLiquidate';
import { formatUnits } from 'viem';

// Asume que ya traes un array `borrowers` de tu hook useAllPositions()
interface Borrower {
    address: `0x${string}`;
    collateral: bigint;
    debt: bigint;
    healthFactor: number;
}
interface Props {
    tokenAddress: string;
    borrowers: Borrower[];
    decimals: number;
}

export function BorrowersTable({ tokenAddress, borrowers, decimals }: Props) {
    const { liquidate, isProcessing } = useLiquidate(tokenAddress);
    const [victim, setVictim] = useState<`0x${string}`>();

    const handleLiquidate = (b: Borrower) => {
        // ‼️ Lógica mínima: liquidas todo lo que puedas (= su deuda total)
        setVictim(b.address);
        liquidate(b.address, b.debt);
    };

    return (
        <table className="w-full text-sm">
            <thead>
                <tr>
                    <th className="text-left">Usuario</th>
                    <th>Colateral</th>
                    <th>Deuda</th>
                    <th>HF</th>
                    <th></th>
                </tr>
            </thead>

            <tbody>
                {borrowers.map((b) => {
                    const coll = Number(formatUnits(b.collateral, decimals));
                    const debt = Number(formatUnits(b.debt, decimals));
                    const canLiquidate = b.healthFactor < 1;

                    return (
                        <tr key={b.address} className="border-t">
                            <td className="pr-2">{b.address.slice(0, 6)}…</td>
                            <td className="text-right">{coll.toFixed(2)}</td>
                            <td className="text-right">{debt.toFixed(2)}</td>
                            <td
                                className={
                                    canLiquidate ? 'text-danger text-right' : 'text-right'
                                }
                            >
                                {b.healthFactor.toFixed(2)}
                            </td>
                            <td className="pl-2">
                                <button
                                    disabled={!canLiquidate || isProcessing}
                                    onClick={() => handleLiquidate(b)}
                                    className="bg-primary text-white px-2 py-1 rounded disabled:opacity-40"
                                >
                                    {isProcessing && victim === b.address
                                        ? '⏳'
                                        : 'Liquidar'}
                                </button>
                            </td>
                        </tr>
                    );
                })}
            </tbody>
        </table>
    );
}
