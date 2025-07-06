'use client';

import { ChakraProvider, defaultSystem } from '@chakra-ui/react';
import { WagmiProvider, createConfig } from 'wagmi';
import { sepolia } from 'wagmi/chains';
import { injected } from 'wagmi/connectors';
import { createPublicClient, http } from 'viem';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// 1. Instancia React Query
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
        <ChakraProvider value={defaultSystem}>
            <WagmiProvider config={wagmiConfig}>
                <QueryClientProvider client={queryClient}>
                    {children}
                </QueryClientProvider>
            </WagmiProvider>
        </ChakraProvider>
    );
}
