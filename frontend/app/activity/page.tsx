// frontend/app/activity/page.tsx
import React from 'react';
import dynamic from 'next/dynamic';
import { MARKETS } from '@/config/markets';

// Cargamos el cliente **sin SSR**:
const ActivityClient = dynamic(
  () => import('@/components/ActivityClient'),
  { ssr: false }
);

export default function ActivityPage() {
  return (
    <main className="min-h-screen bg-bg-light dark:bg-bg-dark p-10 space-y-10">
      {/* Este header SÍ sale en SSR */}
      <header className="space-y-6">
        <h1 className="text-3xl font-bold text-text-primary dark:text-text-primary-dark">
          Historial de Actividad
        </h1>
        <p className="text-text-secondary dark:text-text-secondary-dark">
          Evolución de tu colateral y deuda en el mercado de{' '}
          <strong>USDC</strong>.
        </p>
      </header>

      {/* El componente interactivo se monta **solo** en cliente */}
      <ActivityClient />
    </main>
  );
}
