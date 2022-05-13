import { useFanoutId } from 'hooks/useFanoutId'
import { useEnvironmentCtx } from 'providers/EnvironmentProvider'

import { useDataHook } from './useDataHook'
import { Fanout, FanoutClient } from '@glasseaters/hydra-sdk'
import { useWallet } from '@solana/wallet-adapter-react'
import { asWallet } from 'common/Wallets'
import { LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js'

export type FanoutData = {
  fanoutId: PublicKey
  fanout: Fanout
  nativeAccount: PublicKey
  balance: number
}

export const useFanoutData = () => {
  const { connection } = useEnvironmentCtx()
  const { data: fanoutId } = useFanoutId()
  const wallet = useWallet()
  const fanoutSdk = new FanoutClient(connection, asWallet(wallet!))

  return useDataHook<FanoutData>(
    async () => {
      if (!fanoutId) return
      const [nativeAccount] = await FanoutClient.nativeAccount(fanoutId)
      const fanout = await fanoutSdk.fetch<Fanout>(fanoutId, Fanout)
      const balance =
        (await connection.getBalance(nativeAccount)) / LAMPORTS_PER_SOL
      return { fanoutId, fanout, nativeAccount, balance }
    },
    [fanoutId?.toString()],
    { name: 'useFanoutData' }
  )
}
