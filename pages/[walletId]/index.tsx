import { DisplayAddress } from '@cardinal/namespaces-components'
import { executeTransaction } from '@cardinal/staking'
import { FanoutClient } from '@glasseaters/hydra-sdk'
import { useWallet } from '@solana/wallet-adapter-react'
import { Transaction } from '@solana/web3.js'
import { AsyncButton } from 'common/Button'
import { Header } from 'common/Header'
import { notify } from 'common/Notification'
import { pubKeyUrl, shortPubKey } from 'common/utils'
import { asWallet } from 'common/Wallets'
import { FanoutData, useFanoutData } from 'hooks/useFanoutData'
import { useFanoutMembershipVouchers } from 'hooks/useFanoutMembershipVouchers'
import type { NextPage } from 'next'
import { useRouter } from 'next/router'
import { useEnvironmentCtx } from 'providers/EnvironmentProvider'

const Home: NextPage = () => {
  const router = useRouter()
  const fanoutMembershipVouchers = useFanoutMembershipVouchers()
  const wallet = useWallet()
  const fanoutData = useFanoutData()
  const { connection, environment } = useEnvironmentCtx()

  const distributeShare = async (
    fanoutData: FanoutData,
    addAllMembers: boolean
  ) => {
    try {
      if (wallet && wallet.publicKey && fanoutData.fanoutId) {
        const fanoutSdk = new FanoutClient(connection, asWallet(wallet!))
        if (addAllMembers) {
          if (fanoutMembershipVouchers.data) {
            const distributionMemberSize = 5
            const vouchers = fanoutMembershipVouchers.data
            for (let i = 0; i < vouchers.length; i += distributionMemberSize) {
              let transaction = new Transaction()
              const chunk = vouchers.slice(i, i + distributionMemberSize)
              for (const voucher of chunk) {
                let distMember =
                  await fanoutSdk.distributeWalletMemberInstructions({
                    distributeForMint: false,
                    member: voucher.parsed.membershipKey,
                    fanout: fanoutData.fanoutId,
                    payer: wallet.publicKey,
                  })
                transaction.instructions = [
                  ...transaction.instructions,
                  ...distMember.instructions,
                ]
              }
              await executeTransaction(
                connection,
                asWallet(wallet),
                transaction,
                {
                  confirmOptions: { commitment: 'confirmed', maxRetries: 3 },
                  signers: [],
                }
              )
              const numTransactions = Math.ceil(vouchers.length / 5)
              notify({
                message: `(${
                  i / 5 + 1
                } / ${numTransactions}) Claim tx successful`,
                description: `Claimed shares for ${
                  i + distributionMemberSize > vouchers.length
                    ? vouchers.length
                    : i + distributionMemberSize
                } / ${vouchers.length} from ${fanoutData.fanout.name}`,
                type: 'success',
              })
            }
          } else {
            throw 'No membership data found'
          }
        } else {
          let transaction = new Transaction()
          let distMember = await fanoutSdk.distributeWalletMemberInstructions({
            distributeForMint: false,
            member: wallet.publicKey,
            fanout: fanoutData.fanoutId,
            payer: wallet.publicKey,
          })
          transaction.instructions = [...distMember.instructions]
          await executeTransaction(connection, asWallet(wallet), transaction, {
            confirmOptions: { commitment: 'confirmed', maxRetries: 3 },
            signers: [],
          })
          notify({
            message: `Claim successful`,
            description: `Successfully claimed ${
              addAllMembers ? "everyone's" : 'your'
            } share from ${fanoutData.fanout.name}`,
            type: 'success',
          })
        }
      }
    } catch (e) {
      notify({
        message: `Error claiming your share: ${e}`,
        type: 'error',
      })
    }
  }

  return (
    <div className="bg-white h-screen max-h-screen">
      <Header />
      <main className="h-[80%] py-16 flex flex-1 flex-col justify-center items-center">
        <div className="text-gray-700 w-full max-w-lg py-3 md:px-0 px-10 mb-10">
          {fanoutData.error && (
            <div className="text-gray-700 bg-red-300 w-full max-w-lg text-center py-3 mb-10">
              <div className="font-bold uppercase tracking-wide">
                Hydra Wallet not found
              </div>
              <div
                className="cursor-pointer"
                onClick={() =>
                  router.push(
                    `/${
                      environment.label !== 'mainnet-beta'
                        ? `?cluster=${environment.label}`
                        : ''
                    }`,
                    undefined,
                    { shallow: true }
                  )
                }
              >
                Retry
              </div>
            </div>
          )}

          <div className="mb-5 border-b-2">
            <div className="font-bold uppercase tracking-wide text-2xl mb-1">
              {fanoutData.data?.fanout.name ? (
                fanoutData.data?.fanout.name
              ) : (
                <div className="animate h-6 w-24 animate-pulse bg-gray-200 rounded-md"></div>
              )}
            </div>
            <div className="font-bold uppercase tracking-wide text-lg mb-1 flex items-center gap-1">
              Total Inflow:{' '}
              {fanoutData.data?.fanout ? (
                <>
                  {parseInt(
                    fanoutData.data?.fanout?.totalInflow.toString() ?? '0'
                  ) / 1e9}{' '}
                  ◎
                </>
              ) : (
                <div className="animate h-6 w-10 animate-pulse bg-gray-200 rounded-md"></div>
              )}
            </div>
            <p className="font-bold uppercase tracking-wide text-lg mb-1">
              Balance: {fanoutData.data?.balance} ◎
            </p>
          </div>
          <div className="mb-5">
            <p className="font-bold uppercase tracking-wide text-md mb-1">
              Wallet Address:{' '}
              <a
                className="hover:text-blue-500 transition"
                target="_blank"
                rel="noopener noreferrer"
                href={pubKeyUrl(
                  fanoutData.data?.nativeAccount,
                  environment.label
                )}
              >
                {shortPubKey(fanoutData.data?.nativeAccount)}
              </a>
            </p>
            <p className="font-bold uppercase tracking-wide text-md mb-1">
              Total Members: {fanoutData.data?.fanout?.totalMembers.toString()}
            </p>
            <ul className="list-disc ml-6">
              {!fanoutMembershipVouchers.data ? (
                <>
                  <li className="mb-1 animate h-6 w-24 animate-pulse bg-gray-200 rounded-md"></li>
                  <li className="mb-1 animate h-6 w-24 animate-pulse bg-gray-200 rounded-md"></li>
                  <li className="mb-1 animate h-6 w-24 animate-pulse bg-gray-200 rounded-md"></li>
                </>
              ) : (
                fanoutMembershipVouchers.data?.map((voucher) => (
                  <li
                    key={voucher.pubkey.toString()}
                    className="relative font-bold uppercase tracking-wide text-md mb-1"
                  >
                    <div className="flex">
                      <DisplayAddress
                        connection={connection}
                        address={voucher.parsed.membershipKey}
                      />
                      <span className="ml-2 hover:text-blue-500 transition">
                        {`(${voucher.parsed.shares.toString()} shares, `}
                        {`${
                          parseInt(voucher.parsed.totalInflow.toString()) / 1e9
                        }◎ claimed)`}
                      </span>
                    </div>
                  </li>
                ))
              )}
            </ul>
            <p className="font-bold uppercase tracking-wide text-md mb-1">
              Total Shares: {fanoutData.data?.fanout?.totalShares.toString()}
            </p>
          </div>
          <div className="flex">
            <AsyncButton
              type="button"
              variant="primary"
              bgColor="rgb(96 165 250)"
              className="bg-blue-400 text-white hover:bg-blue-500 px-3 py-2 rounded-md mr-2"
              handleClick={async () =>
                fanoutData.data && distributeShare(fanoutData.data, true)
              }
            >
              Distribute To All
            </AsyncButton>
            <AsyncButton
              type="button"
              variant="primary"
              bgColor="rgb(156 163 175)"
              className="bg-gray-400 text-white hover:bg-blue-500 px-3 py-2 rounded-md "
              handleClick={async () =>
                fanoutData.data && distributeShare(fanoutData.data, false)
              }
            >
              Distribute To Yourself
            </AsyncButton>
          </div>
        </div>
      </main>
    </div>
  )
}

export default Home
