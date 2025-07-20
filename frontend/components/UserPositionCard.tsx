'use client';

function format(value: number, digits = 2, locale = 'en-US') {
    return new Intl.NumberFormat(locale, {
        minimumFractionDigits: digits,
        maximumFractionDigits: digits,
    }).format(value);
}

export function UserPositionCard({
    depositedWei,
    borrowedWei,
    hf,
    symbol,
    decimals = 6,
    loading = false,              
}: {
    depositedWei: bigint;
    borrowedWei: bigint;
    hf: number;
    symbol: string;
    decimals?: number;
    loading?: boolean;             
}) {

    if (loading) {
        return (
            <div className="rounded-2xl border border-secondary-light dark:border-secondary
                bg-surface-light dark:bg-surface-dark shadow-md p-4 space-y-3 animate-pulse">
                <div className="h-4 w-40 bg-gray-300 dark:bg-gray-600 rounded" />
                <div className="h-4 w-32 bg-gray-300 dark:bg-gray-600 rounded" />
                <div className="h-4 w-28 bg-gray-300 dark:bg-gray-600 rounded" />
                <div className="h-4 w-24 bg-gray-300 dark:bg-gray-600 rounded" />
            </div>
        );
    }

    const pow = 10 ** decimals;
    const dep = Number(depositedWei) / pow;
    const debt = Number(borrowedWei) / pow;

    const hfColor =
        hf === Infinity
            ? 'text-gray-500'
            : hf >= 2
                ? 'text-green-500'
                : hf >= 1
                    ? 'text-yellow-500'
                    : 'text-red-500';

    return (
        <div className="rounded-2xl border border-secondary-light dark:border-secondary
                  bg-surface-light dark:bg-surface-dark shadow-md p-4 space-y-3">
            <h3 className="text-base font-bold text-primary dark:text-primary-dark">
                Your Position Summary
            </h3>

            <div className="flex items-baseline gap-2">
                <span className="text-sm text-text-secondary dark:text-text-secondary-dark">
                    Collateral:
                </span>
                <span className="text-sm font-semibold text-text-primary dark:text-text-primary-dark">
                    {format(dep)} {symbol}
                </span>
            </div>

            <div className="flex items-baseline gap-2">
                <span className="text-sm text-text-secondary dark:text-text-secondary-dark">
                    Debt:
                </span>
                <span className="text-sm font-semibold text-text-primary dark:text-text-primary-dark">
                    {format(debt)} {symbol}
                </span>
            </div>

            <div className="flex items-baseline gap-2">
                <span className="text-sm text-text-secondary dark:text-text-secondary-dark">
                    Health Factor:
                </span>
                <span className={`text-sm font-semibold ${hfColor}`}>
                    {hf === Infinity ? '∞' : format(hf, 2)}
                </span>
            </div>
        </div>
    );
}
