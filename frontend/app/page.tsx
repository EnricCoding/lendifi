'use client';

import Link from 'next/link';
import { WalletButton } from '@/components/WalletButton';

export default function HomePage() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen px-4 bg-bg-light dark:bg-bg-dark">
      <h1 className="text-5xl font-extrabold text-text-primary dark:text-text-primary-dark mb-4">
        Bienvenido a LendiFi
      </h1>
      <p className="text-lg text-text-secondary dark:text-text-secondary-dark mb-8 text-center max-w-2xl">
        Un protocolo DeFi simplificado de préstamos y depósitos colateralizados.
      </p>
      <div className="mb-8">
        <WalletButton />
      </div>
      <Link
        href="/dashboard"
        className="inline-block px-6 py-3 bg-primary hover:bg-primary-light text-surface-light dark:text-surface-dark font-semibold rounded-md transition"
      >
        Ir al Dashboard
      </Link>
    </main>
  );
}
