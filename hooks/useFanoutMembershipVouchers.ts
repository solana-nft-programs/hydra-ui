import { useFanoutId } from 'hooks/useFanoutId'
import * as hydra from '@glasseaters/hydra-sdk'
import { BorshAccountsCoder, utils } from '@project-serum/anchor'
import { PublicKey } from '@solana/web3.js'
import { useEnvironmentCtx } from 'providers/EnvironmentProvider'

import { useDataHook } from './useDataHook'
import { AccountData } from '@cardinal/token-manager'
import { FanoutMembershipVoucher } from '@glasseaters/hydra-sdk'

export const useFanoutMembershipVouchers = () => {
  const { connection } = useEnvironmentCtx()
  const { data: fanoutId } = useFanoutId()
  console.log(fanoutId?.toString())
  return useDataHook<AccountData<FanoutMembershipVoucher>[]>(
    async () => {
      if (!fanoutId) return
      const programAccounts = await connection.getProgramAccounts(
        new PublicKey('hyDQ4Nz1eYyegS6JfenyKwKzYxRsCWCriYSAjtzP4Vg'),
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
      const deserializedProgramAccounts = programAccounts.map((account) => {
        return {
          pubkey: account.pubkey,
          parsed: hydra.FanoutMembershipVoucher.fromAccountInfo(
            account.account
          )[0],
        }
      })
      console.log(
        deserializedProgramAccounts
          .map((programAccount) => programAccount.pubkey.toString()).filter((v) => v === '9rA8CJ3bK9F9QMH2EAG7Mt4KSLonu34RjZ68THXJx1ZN')
      )

      console.log(deserializedProgramAccounts)
      return deserializedProgramAccounts
    },
    [fanoutId?.toString()],
    { name: 'useFanoutMembershipVoucher', refreshInterval: 10000 }
  )
}
