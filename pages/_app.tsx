import './styles.css'
import '@cardinal/namespaces-components/dist/esm/styles.css'
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
import { ToastContainer } from 'common/Notification'

require('@solana/wallet-adapter-react-ui/styles.css')

const App = ({
  Component,
  pageProps,
  cluster,
}: AppProps & { cluster: string }) => {
  return (
    <EnvironmentProvider defaultCluster={cluster}>
      <WalletProvider
        wallets={[new PhantomWalletAdapter(), new GlowWalletAdapter()]}
      >
        <WalletIdentityProvider>
          <WalletModalProvider>
            <>
              <ToastContainer />
              <Component {...pageProps} />
            </>
          </WalletModalProvider>
        </WalletIdentityProvider>
      </WalletProvider>
    </EnvironmentProvider>
  )
}

App.getInitialProps = getInitialProps

export default App
