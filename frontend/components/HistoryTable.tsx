'use client';

import React, { useState, useMemo } from 'react';
import { Point } from '@/hooks/useHistory';

const ROWS_PER_PAGE = 20;

interface HistoryTableProps {
    data: Point[];
}

export function HistoryTable({ data }: HistoryTableProps) {
    const [currentPage, setCurrentPage] = useState(1);

    React.useEffect(() => {
        setCurrentPage(1);
    }, [data]);

    const totalPages = Math.ceil(data.length / ROWS_PER_PAGE);

    const paginated = useMemo(
        () =>
            data.slice(
                (currentPage - 1) * ROWS_PER_PAGE,
                currentPage * ROWS_PER_PAGE
            ),
        [data, currentPage]
    );

    return (
        <div>
            <div className="overflow-x-auto">
                <table className="w-full table-auto bg-white rounded-lg shadow">
                    <thead>
                        <tr className="bg-gray-100">
                            <th className="px-4 py-2 text-left text-text-primary">Date</th>
                            <th className="px-4 py-2 text-left text-text-primary">Event</th>
                            <th className="px-4 py-2 text-right text-text-primary">Collateral</th>
                            <th className="px-4 py-2 text-right text-text-primary">Debt</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginated.map((p, i) => (
                            <tr
                                key={(currentPage - 1) * ROWS_PER_PAGE + i}
                                className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                            >
                                <td className="px-4 py-2 text-text-secondary">
                                    {new Date(p.ts).toLocaleString('es-ES', {
                                        day: '2-digit',
                                        month: '2-digit',
                                        year: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit',
                                    })}
                                </td>
                                <td className="px-4 py-2 text-text-secondary">{p.event}</td>
                                <td className="px-4 py-2 text-right text-text-secondary">
                                    {p.collateral.toFixed(2)}
                                </td>
                                <td className="px-4 py-2 text-right text-text-secondary">
                                    {p.debt.toFixed(2)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="flex items-center justify-center space-x-2 mt-4">
                <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50 text-black"
                >
                    ‹ Prev
                </button>

                {Array.from({ length: totalPages }).map((_, idx) => {
                    const page = idx + 1;
                    if (totalPages > 20 && page > 10 && page <= totalPages - 10) {
                        return page === 11 ? <span key={page}>…</span> : null;
                    }
                    return (
                        <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`px-3 py-1 rounded ${page === currentPage ? 'bg-blue-600 text-white' : 'bg-gray-200'
                                }`}
                        >
                            {page}
                        </button>
                    );
                })}

                <button
                    onClick={() =>
                        setCurrentPage((p) => Math.min(totalPages, p + 1))
                    }
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50 text-black"
                >
                    Next ›
                </button>
            </div>
        </div>
    );
}
