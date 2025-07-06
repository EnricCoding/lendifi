export const MARKETS = {
  USDC: { symbol: 'USDC', tokenAddress: process.env.NEXT_PUBLIC_USDC_TOKEN_ADDRESS! },
  DAI:  { symbol: 'DAI',  tokenAddress: process.env.NEXT_PUBLIC_DAI_TOKEN_ADDRESS!  },
} as const;