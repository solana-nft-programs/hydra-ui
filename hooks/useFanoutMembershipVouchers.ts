import { useFanoutId } from 'hooks/useFanoutId'
import * as hydra from '@glasseaters/hydra-sdk'
import { BorshAccountsCoder, utils } from '@project-serum/anchor'
import { PublicKey } from '@solana/web3.js'
import { useEnvironmentCtx } from 'providers/EnvironmentProvider'

import { useDataHook } from './useDataHook'
import { AccountData } from '@cardinal/token-manager'
import { FanoutMembershipVoucher } from '@glasseaters/hydra-sdk'

const HYDRA_PROGRAM_ID = new PublicKey(
  'hyDQ4Nz1eYyegS6JfenyKwKzYxRsCWCriYSAjtzP4Vg'
)

export const useFanoutMembershipVouchers = () => {
  const { connection } = useEnvironmentCtx()
  const { data: fanoutId } = useFanoutId()
  return useDataHook<AccountData<FanoutMembershipVoucher>[]>(
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
                  BorshAccountsCoder.accountDiscriminator(
                    'fanoutMembershipVoucher'
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
          ],
        }
      )
      return programAccounts.map((account) => {
        return {
          pubkey: account.pubkey,
          parsed: hydra.FanoutMembershipVoucher.fromAccountInfo(
            account.account
          )[0],
        }
      })
    },
    [fanoutId?.toString()],
    { name: 'useFanoutMembershipVoucher' }
  )
}
