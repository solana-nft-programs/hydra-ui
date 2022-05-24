import { withFindOrInitAssociatedTokenAccount } from '@cardinal/common'
import { Fanout, FanoutClient, MembershipModel } from '@glasseaters/hydra-sdk'
import { Wallet } from '@saberhq/solana-contrib'
import { Token } from '@solana/spl-token'
import { TOKEN_PROGRAM_ID } from '@solana/spl-token'
import { useWallet } from '@solana/wallet-adapter-react'
import { Keypair, PublicKey, Transaction } from '@solana/web3.js'
import { AsyncButton } from 'common/Button'
import { Header } from 'common/Header'
import { notify } from 'common/Notification'
import { executeTransaction } from 'common/Transactions'
import { tryPublicKey } from 'common/utils'
import { asWallet } from 'common/Wallets'
import { HYDRA_PROGRAM_ID } from 'hooks/useFanoutMints'
import type { NextPage } from 'next'
import { useEnvironmentCtx } from 'providers/EnvironmentProvider'
import { useEffect, useState } from 'react'

const Home: NextPage = () => {
  const { connection } = useEnvironmentCtx()
  const wallet = useWallet()
  const [walletName, setWalletName] = useState<undefined | string>(undefined)
  const [totalShares, setTotalShares] = useState<undefined | number>(100)
  const [tokenAddress, setTokenAddress] = useState<null | string>(null)
  const [validTokenAddress, setValidTokenAddress] = useState<boolean>(false)
  const [success, setSuccess] = useState(false)
  const [hydraWalletMembers, setHydraWalletMembers] = useState<
    { memberKey?: string; shares?: number }[]
  >([{ memberKey: undefined, shares: undefined }])

  const validateAndCreateWallet = async () => {
    try {
      if (!walletName) {
        throw 'Specify a wallet name'
      }
      if (walletName.includes(' ')) {
        throw 'Wallet name cannot contain spaces'
      }
      if (!totalShares) {
        throw 'Please specify the total number of shares for distribution'
      }
      if (totalShares <= 0) {
        throw 'Please specify a positive number of shares'
      }
      if (!validTokenAddress && tokenAddress !== null) {
        throw 'Please enter a valid token address or leave blank'
      }
      let shareSum = 0
      for (const member of hydraWalletMembers) {
        if (!member.memberKey) {
          throw 'Please specify all member public keys'
        }
        if (!member.shares) {
          throw 'Please specify all member shares'
        }
        const memberPubkey = tryPublicKey(member.memberKey)
        if (!memberPubkey) {
          throw 'Invalid member public key, unable to cast to PublicKey'
        }
        if (member.shares <= 0) {
          throw 'Member shares cannot be negative or zero'
        }
        shareSum += member.shares
      }
      if (shareSum !== totalShares) {
        throw `Sum of all shares must equal ${totalShares}`
      }
      if (!hydraWalletMembers || hydraWalletMembers.length == 0) {
        throw 'Please specify at least one member'
      }
      if (!hydraWalletMembers || hydraWalletMembers.length > 9) {
        throw 'Too many members - submit a PR to https://github.com/cardinal-labs/hydra-ui to increase this minimum'
      }

      const fanoutId = (await FanoutClient.fanoutKey(walletName))[0]
      const [nativeAccountId] = await FanoutClient.nativeAccount(fanoutId)
      const fanoutSdk = new FanoutClient(connection, asWallet(wallet!))
      try {
        let fanoutData = await fanoutSdk.fetch<Fanout>(fanoutId, Fanout)
        if (fanoutData) {
          throw `Wallet '${walletName}' already exists`
        }
      } catch (e) {}
      const transaction = new Transaction()
      transaction.add(
        ...(
          await fanoutSdk.initializeFanoutInstructions({
            totalShares,
            name: walletName,
            membershipModel: MembershipModel.Wallet,
          })
        ).instructions
      )
      for (const member of hydraWalletMembers) {
        transaction.add(
          ...(
            await fanoutSdk.addMemberWalletInstructions({
              fanout: fanoutId,
              fanoutNativeAccount: nativeAccountId,
              membershipKey: tryPublicKey(member.memberKey)!,
              shares: member.shares!,
            })
          ).instructions
        )
      }
      await executeTransaction(connection, wallet as Wallet, transaction, {})
      setSuccess(true)
    } catch (e) {
      notify({
        message: `Error creating hydra wallet`,
        description: `${e}`,
        type: 'error',
      })
    }
  }

  useEffect(() => {
    async function checkMintData() {
      if (tokenAddress && tokenAddress.length > 0) {
        try {
          const mint = new PublicKey(tokenAddress)
          const checkMint = new Token(
            connection,
            mint,
            TOKEN_PROGRAM_ID,
            Keypair.generate() // unused
          )
          let mintInfo = await checkMint.getMintInfo()
          if (!mintInfo) {
            throw 'Invalid token address'
          }
          notify({
            message: `Valid Token Address`,
            description: `Custom SPL Token Address added.`,
            type: 'success',
          })
          setValidTokenAddress(true)
        } catch (e) {
          notify({
            message: `Error getting mint data from SPL Token Address`,
            description: `Invalid SPL Token Address. ${e}`,
            type: 'error',
          })
          setValidTokenAddress(false)
        }
      }
    }

    checkMintData()
  }, [tokenAddress])

  return (
    <div className="bg-white h-screen max-h-screen">
      <Header />
      <main className="h-[80%] py-16 flex flex-1 flex-col justify-center items-center">
        {success && (
          <div className="text-gray-700 bg-green-300 w-full max-w-lg text-center py-3 mb-10">
            <p className="font-bold uppercase tracking-wide">
              Hydra Wallet Created
            </p>
            <p>
              {' '}
              Access the wallet at{' '}
              <a
                href={`/${walletName}${window.location.search ?? ''}`}
                className="text-blue-600 hover:text-blue-500"
              >
                {window.location.origin}/{walletName}
                {window.location.search ?? ''}
              </a>
            </p>
          </div>
        )}
        <form className="w-full max-w-lg">
          <div className="w-full mb-6">
            <label
              className="block uppercase tracking-wide text-gray-700 text-xs font-bold mb-2"
              htmlFor="grid-first-name"
            >
              Hydra Wallet Name
            </label>
            <input
              className="appearance-none block w-full bg-gray-200 text-gray-700 border border-gray-200 rounded py-3 px-4 mb-3 leading-tight focus:outline-none focus:bg-white"
              name="grid-first-name"
              type="text"
              placeholder="cardinal-wallet"
              onChange={(e) => {
                setWalletName(e.target.value)
                setSuccess(false)
              }}
              value={walletName}
            />
          </div>
          <div className="w-full mb-6">
            <label
              className="block uppercase tracking-wide text-gray-700 text-xs font-bold mb-2"
              htmlFor="grid-first-name"
            >
              Total Shares
            </label>
            <input
              className="appearance-none block w-full bg-gray-200 text-gray-700 border border-gray-200 rounded py-3 px-4 mb-3 leading-tight focus:outline-none focus:bg-white"
              name="grid-first-name"
              type="number"
              onChange={(e) => {
                setTotalShares(parseInt(e.target.value))
              }}
              value={totalShares}
            />
          </div>
          <div className="w-full mb-6">
            <label
              className="block uppercase tracking-wide text-gray-700 text-xs font-bold mb-2"
              htmlFor="grid-first-name"
            >
              SPL Token Address (if empty defaults to SOL)
            </label>
            <input
              className="appearance-none block w-full bg-gray-200 text-gray-700 border border-gray-200 rounded py-3 px-4 mb-3 leading-tight focus:outline-none focus:bg-white"
              name="grid-first-name"
              type="text"
              placeholder={'So11111111111111111111111111111111111111112'}
              onChange={(e) => {
                setTokenAddress(e.target.value)
              }}
              value={tokenAddress ?? ''}
            />
          </div>
          <div className="flex flex-wrap mb-6">
            <div className="w-4/5 pr-3 mb-6 md:mb-0">
              <label className="block uppercase tracking-wide text-gray-700 text-xs font-bold mb-2">
                Wallet Address
              </label>
              {hydraWalletMembers &&
                hydraWalletMembers.map((member, i) => {
                  return (
                    <input
                      key={i}
                      name="memberKey"
                      className="appearance-none block w-full bg-gray-200 text-gray-700 border border-gray-200 rounded py-3 px-4 mb-3 leading-tight focus:outline-none focus:bg-white"
                      id="grid-first-name"
                      type="text"
                      placeholder="Cmw...4xW"
                      onChange={(e) => {
                        const walletMembers = hydraWalletMembers
                        walletMembers[i]!.memberKey = e.target.value
                        setHydraWalletMembers([...walletMembers])
                      }}
                      value={member.memberKey}
                    />
                  )
                })}
            </div>
            <div className="w-1/5">
              <label className="block uppercase tracking-wide text-gray-700 text-xs font-bold mb-2">
                Shares {totalShares ? `/ ${totalShares}` : ''}
              </label>
              {hydraWalletMembers.map((member, i) => {
                return (
                  <div className="flex" key={`share-${i}`}>
                    <input
                      className="appearance-none block w-full bg-gray-200 text-gray-700 border border-gray-200 rounded py-3 px-4 mb-3 leading-tight focus:outline-none focus:bg-white"
                      id="grid-last-name"
                      type="number"
                      placeholder="50"
                      onChange={(e) => {
                        const walletMembers = hydraWalletMembers
                        walletMembers[i]!.shares = parseInt(e.target.value)
                        setHydraWalletMembers([...walletMembers])
                      }}
                      value={member.shares}
                    />
                  </div>
                )
              })}
            </div>
          </div>
          <div className="flex justify-between">
            <div>
              <button
                type="button"
                className="bg-gray-200 text-gray-600 hover:bg-gray-300 px-4 py-3 rounded-md mr-3"
                onClick={() =>
                  setHydraWalletMembers([
                    ...hydraWalletMembers,
                    {
                      memberKey: undefined,
                      shares: undefined,
                    },
                  ])
                }
              >
                Add Member
              </button>
              <button
                type="button"
                className="bg-gray-200 text-gray-600 hover:bg-gray-300 px-4 py-3 rounded-md "
                onClick={() =>
                  setHydraWalletMembers(
                    hydraWalletMembers.filter(
                      (item, index) => index !== hydraWalletMembers.length - 1
                    )
                  )
                }
              >
                Remove Member
              </button>
            </div>
            <div>
              <AsyncButton
                type="button"
                bgColor="rgb(96 165 250)"
                variant="primary"
                className="bg-blue-400 text-white hover:bg-blue-500 px-4 py-3 rounded-md"
                handleClick={async () => validateAndCreateWallet()}
              >
                Create Hydra Wallet
              </AsyncButton>
            </div>
          </div>
        </form>
      </main>
    </div>
  )
}

export default Home
