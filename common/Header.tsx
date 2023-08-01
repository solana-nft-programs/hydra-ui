import { useWallet } from '@solana/wallet-adapter-react'
import { AccountConnect } from '@cardinal/namespaces-components'

import { Wallet } from '@saberhq/solana-contrib'
import { useRouter } from 'next/router'
import { useEnvironmentCtx } from 'providers/EnvironmentProvider'
import styled from '@emotion/styled'
import { Cluster } from '@solana/web3.js'
import dynamic from 'next/dynamic'

const WalletMultiButton = dynamic(
  () =>
    import("@solana/wallet-adapter-react-ui").then((m) => m.WalletMultiButton),
  { ssr: false },
);

export const StyledWalletButton = styled(WalletMultiButton)`
  color: rgb(55, 65, 81, 1);
  &:hover {
    background: none !important;
  }
  .wallet-adapter-button {
    padding: 0px;
  }
`

export const Header = () => {
  const router = useRouter()
  const ctx = useEnvironmentCtx()
  const wallet = useWallet()
  return (
    <div className={`flex flex-row h-20 justify-between pl-5 text-white`}>
      <div className="flex items-center gap-3">
        <div
          className="text-gray-700 font-bold uppercase tracking-wide hover:cursor-pointer"
          onClick={() =>
            router.push(
              `/${
                ctx.environment.label !== 'mainnet-beta'
                  ? `?cluster=${ctx.environment.label}`
                  : ''
              }`
            )
          }
        >
          Hydra UI
        </div>
        {ctx.environment.label !== 'mainnet-beta' && (
          <div className="cursor-pointer rounded-md bg-[#9945ff] p-1 text-[10px] italic text-white">
            {ctx.environment.label}
          </div>
        )}
      </div>

      <div className="relative my-auto flex items-center pr-8 align-middle">
        <div className="relative my-auto flex items-center align-middle text-gray-700 font-bold uppercase tracking-wide">
          <div
            onClick={() =>
              router.push(
                `/create${
                  ctx.environment.label !== 'mainnet-beta'
                    ? `?cluster=${ctx.environment.label}`
                    : ''
                }`
              )
            }
          >
            <p className="my-auto mr-10 hover:cursor-pointer">Create</p>
          </div>
        </div>
        {wallet.connected && wallet.publicKey ? (
          <AccountConnect
            connection={ctx.connection}
            environment={ctx.environment.label as Cluster}
            handleDisconnect={() => wallet.disconnect()}
            wallet={wallet as Wallet}
          />
        ) : (
          <StyledWalletButton
            style={{
              fontSize: '14px',
              zIndex: 10,
              height: '38px',
              border: 'none',
              backgroundColor: '#512da8'
            }}
          />
        )}
      </div>
    </div>
  )
}
