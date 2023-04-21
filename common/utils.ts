import { web3 } from '@coral-xyz/anchor'
import { BigNumber } from 'bignumber.js'

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

export const tryPublicKey = (
  publicKeyString: web3.PublicKey | string | string[] | undefined | null
): web3.PublicKey | null => {
  if (publicKeyString instanceof web3.PublicKey) return publicKeyString
  if (!publicKeyString) return null
  try {
    return new web3.PublicKey(publicKeyString)
  } catch (e) {
    return null
  }
}

export function pubKeyUrl(
  pubkey: web3.PublicKey | null | undefined,
  cluster: string
) {
  if (!pubkey) return 'https://explorer.solana.com'
  return `https://explorer.solana.com/address/${pubkey.toString()}${
    cluster === 'devnet' ? '?cluster=devnet' : ''
  }`
}

export const hexColor = (colorString: string): string => {
  if (colorString.includes('#')) return colorString
  const [r, g, b] = colorString
    .replace('rgb(', '')
    .replace('rgba(', '')
    .replace(')', '')
    .replace(' ', '')
    .split(',')
  return (
    '#' +
    [r, g, b]
      .map((x) => {
        const hex = parseInt(x || '').toString(16)
        return hex.length === 1 ? '0' + hex : hex
      })
      .join('')
  )
}

export const getColorByBgColor = (bgColor: string) => {
  if (!bgColor) {
    return ''
  }
  return parseInt(hexColor(bgColor).replace('#', ''), 16) > 0xffffff / 2
    ? '#000'
    : '#fff'
}

// Converts amount in decimals to mint amount (natural units)
export function getMintNaturalAmountFromDecimal(
  mintAmount: number,
  decimals: number
) {
  return new BigNumber(mintAmount.toString()).shiftedBy(-decimals)
}
