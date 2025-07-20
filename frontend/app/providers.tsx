'use client';

import { WagmiProvider, createConfig } from 'wagmi';
import { sepolia } from 'wagmi/chains';
import { injected } from 'wagmi/connectors';
import { createPublicClient, http } from 'viem';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';


const queryClient = new QueryClient();

const wagmiConfig = createConfig({
    connectors: [injected()],
    chains: [
        {
            ...sepolia,
            rpcUrls: {
                ...sepolia.rpcUrls,
                default: {
                    ...sepolia.rpcUrls.default,
                    http: [process.env.NEXT_PUBLIC_SEPOLIA_RPC!],
                },
            },
        },
    ],
    client: ({ chain }) =>
        createPublicClient({
            chain,
            transport: http(process.env.NEXT_PUBLIC_SEPOLIA_RPC!),
        }),
});

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <WagmiProvider config={wagmiConfig}>
            <QueryClientProvider client={queryClient}>
                {children}
                <Toaster position="top-right" richColors /> 
            </QueryClientProvider>
        </WagmiProvider>
    );
}
