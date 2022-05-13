import { executeTransaction } from '@cardinal/staking'
import { Fanout, FanoutClient, MembershipModel } from '@glasseaters/hydra-sdk'
import { useWallet } from '@solana/wallet-adapter-react'
import { PublicKey, Transaction } from '@solana/web3.js'
import { notify } from 'common/Notification'
import { asWallet } from 'common/Wallets'
import { useFanoutId } from 'hooks/useFanoutId'
import { useFanoutMembershipVouchers } from 'hooks/useFanoutMembershipVouchers'
import { useRouter } from 'next/router'
import React, { useContext, useEffect, useState } from 'react'
import { useEnvironmentCtx } from './EnvironmentProvider'

export type HydraWallet = {
  walletName: string
  fanoutAccount: PublicKey
  nativeAccount: PublicKey
  fanoutData: Fanout | undefined
  balance: number
}

export type HydraWalletInitParams = {
  walletName: string
  members: {
    publicKey: PublicKey
    shares: number
  }[]
}

export interface HydraContextValues {
  hydraWallet?: HydraWallet
  createHydraWallet: (params: HydraWalletInitParams) => void
  loadHydraWallet: (walletName: string) => void
  claimShare: () => void
}

const HydraContext: React.Context<HydraContextValues> =
  React.createContext<HydraContextValues>({
    createHydraWallet: () => {},
    loadHydraWallet: () => {},
    claimShare: () => {},
  })

export function HydraProvider({ children }: { children: React.ReactNode }) {
  const { connection } = useEnvironmentCtx()
  const wallet = useWallet()

  const fanoutId = useFanoutId()
  const fanoutMembershipVouchers = useFanoutMembershipVouchers()
  const [hydraWallet, setHydraWallet] = useState<undefined | HydraWallet>(
    undefined
  )
  const [walletName, setWalletName] = useState<null | string>(null)
  const {
    query: { walletId },
  } = useRouter()
  const router = useRouter()

  const fanoutSdk = new FanoutClient(connection, asWallet(wallet!))

  const createHydraWallet = async (params: HydraWalletInitParams) => {
    const { fanout, nativeAccount } = await fanoutSdk.initializeFanout({
      totalShares: 100,
      name: params.walletName,
      membershipModel: MembershipModel.Wallet,
    })

    for (const member of params.members) {
      await fanoutSdk.addMemberWallet({
        fanout: fanout,
        fanoutNativeAccount: nativeAccount,
        membershipKey: member.publicKey,
        shares: member.shares,
      })
    }

    const fanoutAccount = await fanoutSdk.fetch<Fanout>(fanout, Fanout)
    const balance = (await connection.getBalance(nativeAccount)) / 1e9

    setHydraWallet({
      walletName: params.walletName,
      fanoutAccount: fanout,
      nativeAccount,
      fanoutData: fanoutAccount,
      balance,
    })
  }

  const loadHydraWallet = async (walletName: string) => {
    try {
      let [fanoutAccount] = await FanoutClient.fanoutKey(walletName)

      let [nativeAccount] = await FanoutClient.nativeAccount(fanoutAccount)
      const fanoutData = await fanoutSdk.fetch<Fanout>(fanoutAccount, Fanout)
      const balance = (await connection.getBalance(nativeAccount)) / 1e9

      setHydraWallet({
        walletName,
        fanoutAccount,
        nativeAccount,
        fanoutData,
        balance,
      })
    } catch (e) {
      notify({
        message: `Incorrect wallet ID, error loading Hydra wallet: ${e}`,
        type: 'error',
      })
      router.push('/')
    }
  }

  const claimShare = async () => {
    try {
      if (wallet && wallet.publicKey && hydraWallet?.fanoutAccount) {
        let distMember1 = await fanoutSdk.distributeWalletMemberInstructions({
          distributeForMint: false,
          member: wallet.publicKey,
          fanout: hydraWallet?.fanoutAccount,
          payer: wallet.publicKey,
        })

        const transaction = new Transaction()

        transaction.instructions = [...distMember1.instructions]

        await executeTransaction(connection, asWallet(wallet), transaction, {
          confirmOptions: { commitment: 'confirmed', maxRetries: 3 },
          signers: [],
        })
        notify({
          message: `Successfully claimed your share from ${hydraWallet.walletName}`,
          type: 'success',
        })
      }
    } catch (e) {
      notify({
        message: `Error claiming your share: ${e}`,
        type: 'error',
      })
    }
  }

  useEffect(() => {
    if (walletId && typeof walletId === 'string') {
      loadHydraWallet(walletId)
    } else {
      setHydraWallet(undefined)
    }
  }, [walletId])

  return (
    <HydraContext.Provider
      value={{
        hydraWallet,
        createHydraWallet,
        loadHydraWallet,
        claimShare,
      }}
    >
      {children}
    </HydraContext.Provider>
  )
}

export function useHydraContext(): HydraContextValues {
  return useContext(HydraContext)
}
