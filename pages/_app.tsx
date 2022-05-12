import '../styles/globals.css'
import 'antd/dist/antd.dark.css'
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
import { HydraProvider } from 'providers/HydraProvider'

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
            <HydraProvider>
              <Component {...pageProps} />
            </HydraProvider>
          </WalletModalProvider>
        </WalletIdentityProvider>
      </WalletProvider>
    </EnvironmentProvider>
  )
}

App.getInitialProps = getInitialProps

export default App
