import '../styles/globals.css'
import type { AppProps } from 'next/app'
import { WalletProvider } from '@solana/wallet-adapter-react'
import { WalletIdentityProvider } from '@cardinal/namespaces-components'
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui'

import {
  EnvironmentProvider,
  getInitialProps,
} from 'providers/EnvironmentProvider'
import {
  GlowWalletAdapter,
  PhantomWalletAdapter,
} from '@solana/wallet-adapter-wallets'
import { useMemo } from 'react'

require('@solana/wallet-adapter-react-ui/styles.css')

const App = ({
  Component,
  pageProps,
  cluster,
}: AppProps & { cluster: string }) => {
  const wallets = useMemo(
    () => [new PhantomWalletAdapter(), new GlowWalletAdapter()],
    []
  )

  return (
    <EnvironmentProvider defaultCluster={cluster}>
      <WalletProvider wallets={wallets}>
        <WalletIdentityProvider>
          <WalletModalProvider>
            <Component {...pageProps} />
          </WalletModalProvider>
        </WalletIdentityProvider>
      </WalletProvider>
    </EnvironmentProvider>
  )
}

App.getInitialProps = getInitialProps

export default App
