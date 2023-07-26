import { DisplayAddress } from '@cardinal/namespaces-components'
import { executeTransaction } from '@cardinal/staking'
import { FanoutClient } from '@glasseaters/hydra-sdk'
import { Wallet } from '@coral-xyz/anchor/dist/cjs/provider'
import { useWallet } from '@solana/wallet-adapter-react'
import { PublicKey, Transaction } from '@solana/web3.js'
import { AsyncButton } from 'common/Button'
import { Header } from 'common/Header'
import { notify } from 'common/Notification'
import {
  getMintNaturalAmountFromDecimal,
  pubKeyUrl,
  shortPubKey,
  tryPublicKey,
} from 'common/utils'
import { asWallet } from 'common/Wallets'
import { paymentMintConfig } from 'config/paymentMintConfig'
import { FanoutData, useFanoutData } from 'hooks/useFanoutData'
import { useFanoutMembershipMintVouchers } from 'hooks/useFanoutMembershipMintVouchers'
import { useFanoutMembershipVouchers } from 'hooks/useFanoutMembershipVouchers'
import { useFanoutMints } from 'hooks/useFanoutMints'
import type { NextPage } from 'next'
import { useRouter } from 'next/router'
import { useEnvironmentCtx } from 'providers/EnvironmentProvider'
import { useEffect, useState } from 'react'

const Home: NextPage = () => {
  const router = useRouter()
  const [mintId, setMintId] = useState<string | undefined>()
  const fanoutMembershipVouchers = useFanoutMembershipVouchers()
  const fanoutMints = useFanoutMints()
  const wallet = useWallet()
  const fanoutData = useFanoutData()
  const { connection, environment } = useEnvironmentCtx()
  let selectedFanoutMint =
    mintId && fanoutMints.data
      ? fanoutMints.data.find((mint) => mint.data.mint.toString() === mintId)
      : undefined
  const fanoutMembershipMintVouchers = useFanoutMembershipMintVouchers(mintId)
  const [voucherMapping, setVoucherMapping] = useState<{
    [key: string]: string
  }>({})

  useEffect(() => {
    const anchor = router.asPath.split('#')[1]
    const fanoutMint = fanoutMints.data?.find(
      (fanoutMint) =>
        fanoutMint.config.symbol === anchor ||
        fanoutMint.id.toString() === anchor
    )
    if (fanoutMint?.data.mint && fanoutMint?.data.mint.toString() !== mintId) {
      selectSplToken(fanoutMint?.data.mint.toString())
    }
  }, [
    router,
    fanoutMints.data?.map((fanoutMint) => fanoutMint.id.toString()).join(','),
  ])

  useEffect(() => {
    const setMapping = async () => {
      if (fanoutMembershipVouchers.data && selectedFanoutMint) {
        let mapping: { [key: string]: string } = {}
        for (const voucher of fanoutMembershipVouchers.data!) {
          const [mintMembershipVoucher] =
            await FanoutClient.mintMembershipVoucher(
              selectedFanoutMint.id,
              voucher.parsed.membershipKey,
              new PublicKey(mintId!)
            )
          mapping[voucher.pubkey.toString()] = mintMembershipVoucher.toString()
        }
        setVoucherMapping(mapping)
      } else {
        setVoucherMapping({})
      }
    }
    setMapping()
  }, [fanoutMembershipVouchers.data, selectedFanoutMint, mintId])

  async function addSplToken() {
    if (fanoutData.data?.fanoutId) {
      try {
        const tokenAddress = prompt('Please enter an SPL token address:')
        const tokenPK = tryPublicKey(tokenAddress)
        if (!tokenPK) {
          throw 'Invalid SPL token address, please enter a valid address based on your network'
        }
        const fanoutSdk = new FanoutClient(connection, asWallet(wallet!))
        const transaction = new Transaction()
        transaction.add(
          ...(
            await fanoutSdk.initializeFanoutForMintInstructions({
              fanout: fanoutData.data?.fanoutId,
              mint: tokenPK,
            })
          ).instructions
        )
        await executeTransaction(connection, wallet as Wallet, transaction, {})
        notify({
          message: 'SPL Token added!',
          description: `Select the new token in the dropdown menu.`,
          type: 'success',
        })
      } catch (e) {
        notify({
          message: 'Error adding SPL Token',
          description: `${e}`,
          type: 'error',
        })
      }
    }
  }

  const selectSplToken = (mintId: string) => {
    setMintId(mintId === 'default' ? undefined : mintId)
    const fanoutMint = fanoutMints.data?.find(
      (fanoutMint) => fanoutMint.data.mint.toString() === mintId
    )
    if (environment.label === 'mainnet-beta') {
      router.push(`#${fanoutMint?.config.symbol ?? ''}`)
    }
  }

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
                    fanoutMint: selectedFanoutMint
                      ? selectedFanoutMint?.data.mint
                      : undefined,
                    distributeForMint: selectedFanoutMint ? true : false,
                    member: voucher.parsed.membershipKey,
                    fanout: fanoutData.fanoutId,
                    payer: wallet.publicKey,
                  })
                transaction.instructions = [
                  ...transaction.instructions,
                  ...distMember.instructions,
                ]
              }

              const { blockhash } = await connection.getLatestBlockhash()
              transaction.recentBlockhash = blockhash
              transaction.feePayer = wallet.publicKey
              transaction = await wallet.signTransaction!(transaction)

              const signature = await connection.sendRawTransaction(
                transaction.serialize(),
                { maxRetries: 3 }
              )

              console.info('Tx sig:', signature)

              await connection.confirmTransaction(signature, 'confirmed')

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
        <div className="text-gray-700 w-full max-w-xl py-3 md:px-0 px-10 mb-10">
          {fanoutData.error && (
            <div className="text-gray-700 bg-red-300 w-full text-center py-3 mb-10">
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
            <div className="flex justify-between">
              <div className="flex-col">
                <div className="font-bold uppercase tracking-wide text-lg mb-1 flex items-center gap-1">
                  Total Inflow:{' '}
                  {selectedFanoutMint ? (
                    `${Number(
                      getMintNaturalAmountFromDecimal(
                        Number(selectedFanoutMint.data.totalInflow),
                        selectedFanoutMint.info.decimals
                      )
                    )} ${selectedFanoutMint.config.symbol}`
                  ) : fanoutData.data?.fanout ? (
                    `${
                      parseInt(
                        fanoutData.data?.fanout?.totalInflow.toString() ?? '0'
                      ) / 1e9
                    } ◎`
                  ) : (
                    <div className="animate h-6 w-10 animate-pulse bg-gray-200 rounded-md"></div>
                  )}
                </div>
                <p className="font-bold uppercase tracking-wide text-lg mb-1">
                  Balance:{' '}
                  {selectedFanoutMint
                    ? `${selectedFanoutMint.balance} ${selectedFanoutMint.config.symbol}`
                    : `${fanoutData.data?.balance}◎`}
                </p>
              </div>

              <div className="">
                <select
                  className="w-min-content bg-gray-700 text-white px-4 py-3 border-r-transparent border-r-8 rounded-md"
                  value={mintId}
                  onChange={(e) => {
                    selectSplToken(e.target.value)
                  }}
                >
                  <option value={'default'}>SOL</option>
                  {fanoutMints.data?.map((fanoutMint) => (
                    <option
                      key={fanoutMint.id.toString()}
                      value={fanoutMint.data.mint.toString()}
                    >
                      {paymentMintConfig[fanoutMint.data.mint.toString()]
                        ? paymentMintConfig[fanoutMint.data.mint.toString()]
                            ?.name
                        : shortPubKey(fanoutMint.data.mint.toString())}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          <div className="mb-5">
            <p className="font-bold uppercase tracking-wide text-md mb-1">
              Fanout Address:{' '}
              <a
                className="hover:text-blue-500 transition"
                target="_blank"
                rel="noopener noreferrer"
                href={pubKeyUrl(fanoutData.data?.fanoutId, environment.label)}
              >
                {shortPubKey(fanoutData.data?.fanoutId.toString())}
              </a>
            </p>
            {selectedFanoutMint ? (
              <p className="font-bold uppercase tracking-wide text-md mb-1">
                {selectedFanoutMint.config.symbol} Wallet Token Account:{' '}
                <a
                  className="hover:text-blue-500 transition"
                  target="_blank"
                  rel="noopener noreferrer"
                  href={pubKeyUrl(
                    selectedFanoutMint.data.tokenAccount,
                    environment.label
                  )}
                >
                  {shortPubKey(selectedFanoutMint.data.tokenAccount)}
                </a>
              </p>
            ) : (
              <p className="font-bold uppercase tracking-wide text-md mb-1">
                Sol Wallet Address:{' '}
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
            )}
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
                fanoutMembershipVouchers.data?.map((voucher, i) => (
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
                        <>
                          {`(${voucher.parsed.shares.toString()} shares, `}
                          {selectedFanoutMint
                            ? fanoutMembershipMintVouchers.data &&
                              fanoutMembershipMintVouchers.data.length > 0
                              ? `${
                                  Number(
                                    getMintNaturalAmountFromDecimal(
                                      Number(
                                        fanoutMembershipMintVouchers.data.filter(
                                          (v) =>
                                            v.pubkey.toString() ===
                                            voucherMapping[
                                              voucher.pubkey.toString()
                                            ]
                                        )[0]?.parsed.lastInflow
                                      ),
                                      selectedFanoutMint.info.decimals
                                    )
                                  ) *
                                  (Number(voucher.parsed.shares) / 100)
                                } ${selectedFanoutMint.config.symbol} claimed)`
                              : `0 ${selectedFanoutMint.config.symbol} claimed)`
                            : `${
                                parseInt(
                                  voucher.parsed.totalInflow.toString()
                                ) / 1e9
                              }◎ claimed)`}
                        </>
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
            {fanoutData.data &&
              fanoutData.data.fanout.authority.toString() ===
                wallet.publicKey?.toString() && (
                <AsyncButton
                  type="button"
                  variant="primary"
                  bgColor="rgb(156 163 175)"
                  className="bg-gray-400 text-white hover:bg-blue-500 px-3 py-2 rounded-md "
                  handleClick={async () => addSplToken()}
                >
                  Add SPL Token
                </AsyncButton>
              )}
          </div>
        </div>
      </main>
    </div>
  )
}

export default Home
