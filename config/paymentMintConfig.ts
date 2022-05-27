export type PaymentMintConfig = {
  name: string
  symbol: string
}

export const paymentMintConfig: { [key: string]: PaymentMintConfig } = {
  Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr: {
    name: 'USDC Devnet',
    symbol: 'USDC',
  },
  EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v: {
    name: 'USDC',
    symbol: 'USDC',
  },
  So11111111111111111111111111111111111111112: {
    name: 'Wrapped SOL',
    symbol: 'wSOL',
  },
}
