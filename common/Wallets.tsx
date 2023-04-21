import type { WalletContextState } from '@solana/wallet-adapter-react'
import { Wallet } from '@coral-xyz/anchor/dist/cjs/provider'

export const asWallet = (wallet: WalletContextState): Wallet => {
  return {
    signTransaction: wallet.signTransaction!,
    signAllTransactions: wallet.signAllTransactions!,
    publicKey: wallet.publicKey!,
  }
}
