import { useWallet } from '@solana/wallet-adapter-react'
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
    <div className="bg-white">
      <Header />

      <main className={styles.main}>
        {hydraWallet && (
          <div className="text-gray-700 w-full max-w-lg py-3 mb-10">
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
            <button
              type="button"
              className="bg-blue-400 text-white hover:bg-blue-500 px-3 py-2 rounded-md "
              onClick={() => claimShare()}
            >
              Claim Share
            </button>
          </div>
        )}
      </main>

      <footer className={styles.footer}>
        <a
          href="https://vercel.com?utm_source=create-next-app&utm_medium=default-template&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          Powered by{' '}
          <span className={styles.logo}>
            <Image src="/vercel.svg" alt="Vercel Logo" width={72} height={16} />
          </span>
        </a>
      </footer>
    </div>
  )
}

export default Home
