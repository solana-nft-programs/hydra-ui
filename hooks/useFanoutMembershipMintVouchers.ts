import { tryPublicKey } from './../common/utils'
import { useFanoutId } from 'hooks/useFanoutId'
import * as hydra from '@glasseaters/hydra-sdk'
import { BorshAccountsCoder, utils } from '@coral-xyz/anchor'
import { PublicKey } from '@solana/web3.js'
import { useEnvironmentCtx } from 'providers/EnvironmentProvider'

import { useDataHook } from './useDataHook'
import { AccountData } from '@cardinal/common'
import { FanoutMembershipMintVoucher } from '@glasseaters/hydra-sdk'

const HYDRA_PROGRAM_ID = new PublicKey(
  'hyDQ4Nz1eYyegS6JfenyKwKzYxRsCWCriYSAjtzP4Vg'
)

export const useFanoutMembershipMintVouchers = (
  fanoutMintId?: string | null
) => {
  const { connection } = useEnvironmentCtx()
  const { data: fanoutId } = useFanoutId()
  return useDataHook<AccountData<FanoutMembershipMintVoucher>[]>(
    async () => {
      if (!fanoutId || !fanoutMintId || !tryPublicKey(fanoutMintId)) return
      const programAccounts = await connection.getProgramAccounts(
        HYDRA_PROGRAM_ID,
        {
          filters: [
            {
              memcmp: {
                offset: 0,
                bytes: utils.bytes.bs58.encode(
                  BorshAccountsCoder.accountDiscriminator(
                    'fanoutMembershipMintVoucher'
                  )
                ),
              },
            },
            {
              memcmp: {
                offset: 8,
                bytes: fanoutId.toBase58(),
              },
            },
            {
              memcmp: {
                offset: 40,
                bytes: tryPublicKey(fanoutMintId)!.toBase58(),
              },
            },
          ],
        }
      )

      return programAccounts.map((account) => {
        return {
          pubkey: account.pubkey,
          parsed: hydra.FanoutMembershipMintVoucher.fromAccountInfo(
            account.account
          )[0],
        }
      })
    },
    [fanoutId?.toString(), fanoutMintId],
    { name: 'useFanoutMembershipMintVouchers' }
  )
}
