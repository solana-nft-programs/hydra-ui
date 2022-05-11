import { FanoutClient, MembershipModel } from '@glasseaters/hydra-sdk'
import NodeWallet from '@project-serum/anchor/dist/cjs/nodewallet'
import { useWallet } from '@solana/wallet-adapter-react'
import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
} from '@solana/web3.js'
import { Header } from 'common/Header'
import { asWallet } from 'common/Wallets'
import type { NextPage } from 'next'
import Image from 'next/image'
import { useState } from 'react'
import styles from '../styles/Home.module.css'

const Home: NextPage = () => {
  const wallet = useWallet()

  let [hydraState, setHydraState] = useState<{
    hydraWallet?: HydraWallet
    members?: PublicKey[]
  }>({})

  let fanoutSdk: FanoutClient
  let hydraWallet: HydraWallet

  type HydraWallet = {
    fanout: PublicKey // Location of config address on-chain
    nativeAccount: PublicKey // Account address of fanout wallet
  }

  const createHydraWallet = async () => {
    if (wallet && wallet.publicKey) {
      const walletName = 'cardinal-devnet-4'
      await initializeHydraClient()

      alert('Created Hydra Client')

      hydraWallet = await initializeHydraWallet(walletName)

      const collectionWallet = new Keypair()

      alert('Wallet created!')

      await addMemberToHydraWallet(wallet.publicKey, 50)
      await addMemberToHydraWallet(collectionWallet.publicKey, 50)
      alert('Members added!')

      setHydraState({
        hydraWallet,
        members: [wallet.publicKey, collectionWallet.publicKey],
      })
    }
  }

  const initializeHydraClient = async () => {
    const connection = new Connection(
      'https://purple-old-lake.solana-devnet.quiknode.pro/13480a1cc2033abc1d3523523bc1acabd97b6874/',
      'confirmed'
    )

    fanoutSdk = new FanoutClient(connection, asWallet(wallet!))
  }

  const initializeHydraWallet = async (walletName: string) => {
    console.log(fanoutSdk)
    const { fanout, nativeAccount } = await fanoutSdk.initializeFanout({
      totalShares: 100,
      name: walletName,
      membershipModel: MembershipModel.Wallet,
    })

    return { fanout: fanout, nativeAccount: nativeAccount } as HydraWallet
  }

  const retrieveHydraWallet = async (name: string) => {
    let [key, bump] = await FanoutClient.fanoutKey(name)
    let [holdingAccount, bump2] = await FanoutClient.nativeAccount(key)
    console.log(key.toString(), holdingAccount.toString())
    return { fanout: key, nativeAccount: holdingAccount } as HydraWallet
  }

  const addMemberToHydraWallet = async (member: PublicKey, shares: number) => {
    const member1 = new Keypair()
    const { membershipAccount } = await fanoutSdk.addMemberWallet({
      fanout: hydraWallet.fanout,
      fanoutNativeAccount: hydraWallet.nativeAccount,
      membershipKey: member1.publicKey,
      shares: shares,
    })

    return membershipAccount
  }

  return (
    <div className={styles.container}>
      <Header />

      <main className={styles.main}>
        <button onClick={() => createHydraWallet()}>Create Hydra Wallet</button>
        <h1 className={styles.title}>
          Welcome to <a href="https://nextjs.org">Hydra Playground!</a>
        </h1>
        {hydraState.hydraWallet && (
          <div>
            <p>
              Hydra Wallet Address:{' '}
              {hydraState.hydraWallet.nativeAccount.toString()} (100 shares)
            </p>
          </div>
        )}
        {hydraState.members && (
          <div>
            {hydraState.members.map((member) => (
              <p key={member.toString()}>
                Member Added: {member.toString()} (50 shares)
              </p>
            ))}
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
