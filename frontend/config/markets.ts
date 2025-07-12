export const MARKETS = {
  USDC: {
    symbol: "USDC",
    tokenAddress: process.env.NEXT_PUBLIC_USDC_TOKEN_ADDRESS!,
    decimals: 6,
    ltvRatio: 80,
  },
  DAI: {
    symbol: "DAI",
    tokenAddress: process.env.NEXT_PUBLIC_DAI_TOKEN_ADDRESS!,
    decimals: 18,
    ltvRatio: 80,
  },
} as const;
