// components/UserPositionCard.tsx
'use client';

function format(
    value: number,
    digits: number = 2,
    locale = 'es-ES'
) {
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
    decimals = 6,        // ← para USDC = 6
}: {
    depositedWei: bigint;
    borrowedWei: bigint;
    hf: number;
    symbol: string;
    decimals?: number;
}) {
    /* convierte a unidades de token */
    const pow = 10 ** decimals;
    const dep = Number(depositedWei) / pow;
    const debt = Number(borrowedWei) / pow;

    /* color del HF */
    const hfColor =
        hf === Infinity ? 'text-gray-500'
            : hf >= 2 ? 'text-green-500'
                : hf >= 1 ? 'text-yellow-500'
                    : 'text-red-500';

    return (
        <div className="
      rounded-2xl border border-secondary-light dark:border-secondary
      bg-surface-light dark:bg-surface-dark
      shadow-md p-4 space-y-3
    ">
            <h3 className="text-base font-bold text-primary dark:text-primary-dark">
                Resumen de tu posición
            </h3>

            <div className="flex items-baseline gap-2">
                <span className="text-sm text-text-secondary dark:text-text-secondary-dark">
                    Colateral:
                </span>
                <span className="text-sm font-semibold text-text-primary dark:text-text-primary-dark">
                    {format(dep)} {symbol}
                </span>
            </div>

            <div className="flex items-baseline gap-2">
                <span className="text-sm text-text-secondary dark:text-text-secondary-dark">
                    Deuda:
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
