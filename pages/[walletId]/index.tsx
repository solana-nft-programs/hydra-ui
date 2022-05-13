import { useWallet } from '@solana/wallet-adapter-react'
import { AsyncButton } from 'common/Button'
import { Header } from 'common/Header'
import { notify } from 'common/Notification'
import { pubKeyUrl, shortPubKey, tryPublicKey } from 'common/utils'
import type { NextPage } from 'next'
import Image from 'next/image'
import { useRouter } from 'next/router'
import { useEnvironmentCtx } from 'providers/EnvironmentProvider'
import { HydraWalletInitParams, useHydraContext } from 'providers/HydraProvider'
import { useState } from 'react'
import styles from '../../styles/Home.module.css'

const Home: NextPage = () => {
  const wallet = useWallet()
  const { hydraWallet, claimShare } = useHydraContext()
  const { connection, environment } = useEnvironmentCtx()

  return (
    <div className="bg-white h-screen max-h-screen">
      <Header />
      <main className="h-[90%] py-16 flex flex-1 flex-col justify-center items-center">
        {hydraWallet && (
          <div className="text-gray-700 w-full max-w-lg py-3 md:px-0 px-10 mb-10">
            <div className="mb-5 border-b-2">
              <p className="font-bold uppercase tracking-wide text-2xl mb-1">
                {hydraWallet.walletName}
              </p>
              <p className="font-bold uppercase tracking-wide text-lg mb-1">
                Total Inflow:{' '}
                {parseInt(
                  hydraWallet.fanoutData?.totalInflow.toString() ?? '0'
                ) / 1e9}{' '}
                ◎
              </p>
              <p className="font-bold uppercase tracking-wide text-lg mb-1">
                Balance: {hydraWallet.balance} ◎
              </p>
            </div>
            <div className="mb-5">
              <p className="font-bold uppercase tracking-wide text-md mb-1">
                Wallet Address:{' '}
                <a
                  target="_blank"
                  rel="noopener noreferrer"
                  href={pubKeyUrl(hydraWallet.nativeAccount, environment.label)}
                >
                  {shortPubKey(hydraWallet.nativeAccount)}
                </a>
              </p>
              <p className="font-bold uppercase tracking-wide text-md mb-1">
                Total Members: {hydraWallet.fanoutData?.totalMembers.toString()}
              </p>
              <p className="font-bold uppercase tracking-wide text-md mb-1">
                Total Shares: {hydraWallet.fanoutData?.totalShares.toString()}
              </p>
            </div>
            <AsyncButton
              type="button"
              variant="primary"
              bgColor="rgb(96 165 250)"
              className="bg-blue-400 text-white hover:bg-blue-500 px-3 py-2 rounded-md "
              handleClick={async () => claimShare()}
            >
              Claim Share
            </AsyncButton>
          </div>
        )}
      </main>
    </div>
  )
}

export default Home
