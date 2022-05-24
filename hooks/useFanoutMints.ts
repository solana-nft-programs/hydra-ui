import { useFanoutId } from 'hooks/useFanoutId'
import * as hydra from '@glasseaters/hydra-sdk'
import { BorshAccountsCoder, utils } from '@project-serum/anchor'
import { PublicKey } from '@solana/web3.js'
import { useEnvironmentCtx } from 'providers/EnvironmentProvider'

import { useDataHook } from './useDataHook'
import { AccountData } from '@cardinal/token-manager'
import { FanoutMint } from '@glasseaters/hydra-sdk'

export const HYDRA_PROGRAM_ID = new PublicKey(
  'hyDQ4Nz1eYyegS6JfenyKwKzYxRsCWCriYSAjtzP4Vg'
)

export type FanoutMintData = {
  fanoutMintId: PublicKey
  fanoutMint: FanoutMint
  balance: number
}

export const useFanoutMints = () => {
  const { connection } = useEnvironmentCtx()
  const { data: fanoutId } = useFanoutId()
  return useDataHook<FanoutMintData[]>(
    async () => {
      if (!fanoutId) return
      const programAccounts = await connection.getProgramAccounts(
        HYDRA_PROGRAM_ID,
        {
          filters: [
            {
              memcmp: {
                offset: 0,
                bytes: utils.bytes.bs58.encode(
                  BorshAccountsCoder.accountDiscriminator('fanoutMint')
                ),
              },
            },
            {
              memcmp: {
                offset: 40,
                bytes: fanoutId.toBase58(),
              },
            },
          ],
        }
      )
      const fanoutMints = await Promise.all(
        programAccounts.map(async (account) => {
          return {
            fanoutMintId: account.pubkey,
            fanoutMint: hydra.FanoutMint.fromAccountInfo(account.account)[0],
            balance: parseFloat(
              (
                await connection.getTokenAccountBalance(
                  hydra.FanoutMint.fromAccountInfo(account.account)[0]
                    .tokenAccount
                )
              ).value.uiAmountString ?? '0'
            ),
          } as FanoutMintData
        })
      )
      return fanoutMints
    },
    [fanoutId?.toString()],
    { name: 'useFanoutMembershipVoucher' }
  )
}
