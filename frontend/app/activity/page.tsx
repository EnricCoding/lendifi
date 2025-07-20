import React from 'react';
import dynamic from 'next/dynamic';

const ActivityClient = dynamic(
  () => import('@/components/ActivityClient'),
  { ssr: false }
);

export default function ActivityPage() {
  return (
    <main className="min-h-screen bg-bg-light dark:bg-bg-dark p-10 space-y-10">
      <header className="space-y-6">
        <h1 className="text-3xl font-bold text-text-primary dark:text-text-primary-dark">
          Activity History
        </h1>
        <p className="text-text-secondary dark:text-text-secondary-dark">
          Evolution of your collateral and debt in the <strong>USDC</strong> market.
        </p>
      </header>

      <ActivityClient />
    </main>
  );
}
