'use client';

import Link from 'next/link';
import { WalletButton } from './WalletButton';

export function Navbar() {
    return (
        <nav className="sticky top-0 z-50 bg-bg-light/80 backdrop-blur-md border-b border-surface-light dark:bg-bg-dark/80 dark:border-surface-dark">
            <div className="mx-auto flex items-center justify-between px-4 py-3 max-w-6xl">
                <div>
                    <Link
                        href="/"
                        className="text-lg font-semibold text-text-primary dark:text-text-primary-dark hover:text-primary-light"
                    >
                        LendiFi
                    </Link>
                </div>
                <div className="hidden md:flex space-x-8">
                    <Link
                        href="/dashboard"
                        className="text-md font-medium text-text-secondary dark:text-text-secondary-dark hover:text-primary-light"
                    >
                        Dashboard
                    </Link>
                    <Link
                        href="/markets"
                        className="text-md font-medium text-text-secondary dark:text-text-secondary-dark hover:text-primary-light"
                    >
                        Markets
                    </Link>
                    <Link
                        href="/activity"
                        className="text-md font-medium text-text-secondary dark:text-text-secondary-dark hover:text-primary-light"
                    >
                        Activity
                    </Link>
                </div>
                <div>
                    <WalletButton />
                </div>
            </div>
        </nav>
    );
}
