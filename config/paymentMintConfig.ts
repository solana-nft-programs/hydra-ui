export type PaymentMintConfig = {
  name: string
  symbol: string
}

export const paymentMintConfig: { [key: string]: PaymentMintConfig } = {
  Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr: {
    name: 'USDC Devnet',
    symbol: 'USDC',
  },
}
