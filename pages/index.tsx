import { executeTransaction } from '@cardinal/staking'
import {
  Fanout,
  FanoutClient,
  FanoutMembershipVoucher,
  MembershipModel,
} from '@glasseaters/hydra-sdk'
import NodeWallet from '@project-serum/anchor/dist/cjs/nodewallet'
import { useWallet } from '@solana/wallet-adapter-react'
import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  Transaction,
} from '@solana/web3.js'
import { Header } from 'common/Header'
import { notify } from 'common/Notification'
import { tryPublicKey } from 'common/utils'
import { asWallet } from 'common/Wallets'
import type { NextPage } from 'next'
import Image from 'next/image'
import { useRouter } from 'next/router'
import { useEnvironmentCtx } from 'providers/EnvironmentProvider'
import { HydraWalletInitParams, useHydraContext } from 'providers/HydraProvider'
import { useState } from 'react'
import styles from '../styles/Home.module.css'

const Home: NextPage = () => {
  const [walletName, setWalletName] = useState<string>('')
  const router = useRouter()
  const ctx = useEnvironmentCtx()

  return (
    <div className="bg-white h-screen max-h-screen">
      <Header />
      <main className="h-[90%] py-16 flex flex-1 flex-col justify-center items-center">
        <div className="block uppercase tracking-wide text-gray-700 text-lg font-bold mb-6">
          Welcome to Hydra UI
        </div>
        <form className="w-full max-w-lg">
          <div className="w-full mb-6">
            <label
              className="block uppercase tracking-wide text-gray-700 text-xs font-bold mb-2"
              htmlFor="grid-first-name"
            >
              Wallet Name
            </label>
            <input
              className="appearance-none block w-full bg-gray-200 text-gray-700 border border-gray-200 rounded py-3 px-4 mb-3 leading-tight focus:outline-none focus:bg-white"
              id="grid-first-name"
              type="text"
              placeholder="cardinal-wallet"
              onChange={(e) => {
                setWalletName(e.target.value)
              }}
              value={walletName}
            />
            <div>
              <button
                type="button"
                className="bg-blue-400 text-white hover:bg-blue-500 px-4 py-3 rounded-md float-right"
                onClick={() => {
                  router.push(
                    `/${walletName}${
                      ctx.environment.label !== 'mainnet'
                        ? `?cluster=${ctx.environment.label}`
                        : ''
                    }`
                  )
                }}
              >
                Load Hydra Wallet
              </button>
            </div>
          </div>
        </form>
      </main>
    </div>
  )
}

export default Home
