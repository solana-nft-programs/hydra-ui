export type PaymentMintConfig = {
  name: string
  symbol: string
}

export const paymentMintConfig: { [key: string]: PaymentMintConfig } = {
  '6bDUpU1MtwiEQcUs7mkw8C8Veb5HxsdrV5jeiTqKCDY7': {
    name: 'USDC Devnet',
    symbol: 'USDC',
  },
  '7Vz2YnxdtvbVYuddTKjopnWbCyy4KfTB1BVjYzZKeYQd': {
    name: 'USDT Devnet',
    symbol: 'USDT',
  },
  EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v: {
    name: 'USDC',
    symbol: 'USDC',
  },
  Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB: {
    name: 'USDT',
    symbol: 'USDT',
  },
  DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263: {
    name: 'Bonk',
    symbol: 'Bonk',
  },
  So11111111111111111111111111111111111111112: {
    name: 'Wrapped SOL',
    symbol: 'wSOL',
  },
}
