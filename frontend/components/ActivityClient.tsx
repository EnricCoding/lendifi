'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAccount } from 'wagmi';
import {
    ResponsiveContainer,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as RechartsTooltip,
    Legend,
} from 'recharts';
import { useHistory, Point } from '@/hooks/useHistory';
import { MARKETS } from '@/config/markets';
import { HistoryTable } from '@/components/HistoryTable';

const POOL_ADDRESS = process.env.NEXT_PUBLIC_LENDING_POOL_ADDRESS!;

export default function ActivityClient() {
    const { address, isConnected } = useAccount();
    const [mounted, setMounted] = useState(false);
    const [selected, setSelected] = useState<keyof typeof MARKETS>('USDC');

    /* ▼ selector de rango de días */
    const ranges = [
        { label: '7 d', value: 7 },
        { label: '30 d', value: 30 },
        { label: '90 d', value: 90 },
        { label: '1 año', value: 365 },
    ];
    const [daysAgo, setDaysAgo] = useState<number>(365);
    /* ▲ */

    useEffect(() => setMounted(true), []);

    const userAddress = address as `0x${string}`;
    const market = MARKETS[selected];
    const tokenSymbol = market.symbol;               // ← símbolo (USDC, DAI…)

    const {
        data: historyData,
        isLoading,
        isFetching,
        isError,
        refetch,
    } = useHistory(
        POOL_ADDRESS,
        market.tokenAddress,
        userAddress,
        market.decimals,
        daysAgo
    );
    const history: Point[] = historyData ?? [];

    /* gráfico (antiguo → reciente, sólo fecha) */
    const chartData = useMemo(
        () =>
            history.map((p) => ({
                time: new Date(p.ts).toLocaleDateString('es-ES', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                }),
                Colateral: p.collateral,
                Deuda: p.debt,
            })),
        [history]
    );

    /* tabla (reciente → antiguo) */
    const tableData = useMemo(() => [...history].sort((a, b) => b.ts - a.ts), [
        history,
    ]);

    /* estados iniciales */
    if (!mounted)
        return (
            <div className="p-6 flex items-center justify-center">
                Cargando historial…
            </div>
        );

    if (!isConnected)
        return (
            <div className="p-6 flex items-center justify-center">
                <p>Conecta tu wallet para ver tu historial de actividad.</p>
            </div>
        );

    return (
        <div className="space-y-6 p-6">
            {/* Selector de mercado, rango y refrescar */}
            <div className="flex flex-wrap gap-4 items-center">
                {/* Mercado */}
                <label className="flex items-center gap-2 text-black">
                    Mercado:
                    <select
                        value={selected}
                        onChange={(e) =>
                            setSelected(e.target.value as keyof typeof MARKETS)
                        }
                        className="px-3 py-2 border rounded-md text-black"
                    >
                        {Object.keys(MARKETS).map((key) => (
                            <option key={key} value={key}>
                                {MARKETS[key as keyof typeof MARKETS].symbol}
                            </option>
                        ))}
                    </select>
                </label>

                {/* Rango */}
                <label className="flex items-center gap-2 text-black">
                    Rango:
                    <select
                        value={daysAgo}
                        onChange={(e) => setDaysAgo(Number(e.target.value))}
                        className="px-3 py-2 border rounded-md text-black"
                    >
                        {ranges.map((r) => (
                            <option key={r.value} value={r.value}>
                                {r.label}
                            </option>
                        ))}
                    </select>
                </label>

                {/* Botón actualizar */}
                <button
                    onClick={() => refetch()}
                    disabled={isLoading || isFetching}
                    className={`px-4 py-2 rounded-md text-white transition ${isLoading || isFetching
                        ? 'bg-blue-300 cursor-not-allowed opacity-70'
                        : 'bg-blue-600 hover:bg-blue-500'
                        }`}
                >
                    {isLoading || isFetching ? 'Actualizando…' : 'Actualizar'}
                </button>
            </div>

            {/* Contenido principal */}
            {isLoading || isFetching ? (
                <div className="flex flex-col items-center justify-center h-64">
                    <svg
                        className="animate-spin h-8 w-8 text-primary mb-4"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
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
                    <span className="text-text-secondary">Cargando datos…</span>
                </div>
            ) : isError ? (
                <div>
                    <p>Error cargando el historial.</p>
                    <button
                        onClick={() => refetch()}
                        className="px-4 py-2 bg-red-600 text-white rounded-md"
                    >
                        Reintentar
                    </button>
                </div>
            ) : history.length === 0 ? (
                <p className="mt-2 text-black">
                    No hay movimientos en el rango seleccionado.
                </p>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Gráfico */}
                    <div className="p-4 bg-gray-50 rounded-lg shadow">
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart
                                data={chartData}
                                margin={{ top: 5, right: 20, bottom: 5, left: 20 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" />

                                <XAxis
                                    dataKey="time"
                                    tickFormatter={(v) => v}
                                    interval="preserveStartEnd"
                                />

                                <YAxis
                                    label={{
                                        value: tokenSymbol,
                                        angle: -90,
                                        position: 'outsideLeft',
                                        dy: 10,
                                        style: { fill: '#1F2937', fontSize: 12, fontWeight: 600 },
                                    }}
                                />

                                <RechartsTooltip
                                    labelFormatter={(l) => `Fecha: ${l}`}
                                    formatter={(v: number) => `${v.toFixed(2)} ${tokenSymbol}`}
                                />

                                <Legend />

                                <Line
                                    type="monotone"
                                    dataKey="Colateral"
                                    name={`Colateral (${tokenSymbol})`}
                                    stroke="#3182ce"
                                    dot={false}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="Deuda"
                                    name={`Deuda (${tokenSymbol})`}
                                    stroke="#e53e3e"
                                    dot={false}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Tabla con paginación */}
                    <HistoryTable data={tableData} />
                </div>
            )}
        </div>
    );
}
