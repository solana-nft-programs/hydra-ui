import { Header } from 'common/Header'
import type { NextPage } from 'next'
import { useRouter } from 'next/router'
import { useEnvironmentCtx } from 'providers/EnvironmentProvider'
import { useState } from 'react'

const Home: NextPage = () => {
  const [walletName, setWalletName] = useState<string>('')
  const router = useRouter()
  const ctx = useEnvironmentCtx()

  return (
    <div className="bg-white h-screen max-h-screen">
      <Header />
      <main className="h-[80%] flex flex-1 flex-col justify-center items-center">
        <div className="block uppercase tracking-wide text-gray-700 text-lg font-bold mb-6">
          Welcome to Hydra UI
        </div>
        <form
          className="w-full max-w-lg"
          onSubmit={(e) => {
            e.preventDefault()
            router.push(
              `/${walletName}${
                ctx.environment.label !== 'mainnet'
                  ? `?cluster=${ctx.environment.label}`
                  : ''
              }`,
              undefined,
              { shallow: true }
            )
          }}
        >
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
              onSubmit={() => alert('HEr')}
              type="text"
              placeholder="cardinal-wallet"
              onChange={(e) => {
                setWalletName(e.target.value)
              }}
              value={walletName}
            />
            <div>
              <div
                className="bg-blue-400 text-white hover:bg-blue-500 px-4 py-3 rounded-md float-right cursor-pointer"
                onClick={() => {
                  router.push(
                    `/${walletName}${
                      ctx.environment.label !== 'mainnet'
                        ? `?cluster=${ctx.environment.label}`
                        : ''
                    }`,
                    undefined,
                    { shallow: true }
                  )
                }}
              >
                Load Hydra Wallet
              </div>
            </div>
          </div>
        </form>
      </main>
    </div>
  )
}

export default Home
