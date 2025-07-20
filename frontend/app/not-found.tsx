'use client';

import Link from 'next/link';

export default function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-bg-light dark:bg-bg-dark">
      <h1 className="text-3xl font-bold text-text-primary dark:text-text-primary-dark mb-4">
        404 — Page Not Found
      </h1>
      <p className="text-text-secondary dark:text-text-secondary-dark mb-6">
        Sorry, we couldn&#39;t find what you were looking for.
      </p>
      <Link
        href="/"
        className="inline-block px-6 py-3 bg-primary hover:bg-primary-light text-surface-light dark:text-surface-dark font-semibold rounded-md transition"
      >
        Back to Home
      </Link>
    </div>
  );
}
