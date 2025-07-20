'use client';

import { useState, useEffect } from 'react';
import { useAccount, useConnect, useDisconnect } from 'wagmi';

export function WalletButton() {
    const { address, isConnected } = useAccount();
    const { connect, connectors, status } = useConnect();
    const { disconnect } = useDisconnect();
    const isConnecting = status === 'pending';

    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    if (!mounted) {
        return (
            <button
                disabled
                className="px-4 py-2 bg-blue-600 text-white rounded-md opacity-50 cursor-not-allowed"
            >
                Connect Wallet
            </button>
        );
    }

    if (isConnected) {
        const shortAddress = `${address?.slice(0, 6)}…${address?.slice(-4)}`;
        return (
            <button
                onClick={() => disconnect()}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md flex items-center space-x-2"
            >
                <span>Disconnect</span>
                <span className="font-mono text-sm">{shortAddress}</span>
            </button>
        );
    }

    return (
        <button
            onClick={() => {
                const inj = connectors.find((c) => c.id === 'injected');
                if (inj) connect({ connector: inj });
            }}
            disabled={isConnecting}
            className={`px-4 py-2 rounded-md text-white font-medium transition ${isConnecting
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700'
                } flex items-center space-x-2`}
        >
            {isConnecting && (
                <svg
                    className="animate-spin h-4 w-4 text-white"
                    viewBox="0 0 24 24"
                    fill="none"
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
                        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                        fill="currentColor"
                    />
                </svg>
            )}
            <span>{isConnecting ? 'Connecting…' : 'Connect Wallet'}</span>
        </button>
    );
}
