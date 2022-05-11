import { web3 } from '@project-serum/anchor'

export const firstParam = (param: string | string[] | undefined): string => {
  if (!param) return ''
  return typeof param === 'string' ? param : param[0] || ''
}

export function shortPubKey(
  pubkey: web3.PublicKey | string | null | undefined
) {
  if (!pubkey) return ''
  return `${pubkey?.toString().substring(0, 4)}..${pubkey
    ?.toString()
    .substring(pubkey?.toString().length - 4)}`
}
