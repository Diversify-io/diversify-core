import 'dotenv/config'

/**
 * Helper to get node uri
 * @param networkName
 * @returns node uri
 */
export function node_url(networkName: string): string {
  if (networkName) {
    const uri = process.env['ETH_NODE_URI_' + networkName.toUpperCase()]
    if (uri && uri !== '') {
      return uri
    }
  }

  if (networkName === 'localhost') {
    // do not use ETH_NODE_URI
    return 'http://localhost:8545'
  }

  const infuraKey = process.env.INFURA_API_KEY
  if (!infuraKey || infuraKey === '') return ''

  const uri = `https://${networkName}.infura.io/v3/${infuraKey}`
  return uri
}

/**
 * Helper to get mnemonic
 * @param networkName
 * @returns mmnemonic
 */
export function getMnemonic(networkName?: string): string {
  if (networkName) {
    const mnemonic = process.env['MNEMONIC_' + networkName.toUpperCase()]
    if (mnemonic && mnemonic !== '') {
      return mnemonic
    }
  }

  const mnemonic = process.env.MNEMONIC
  if (!mnemonic || mnemonic === '') {
    return 'test test test test test test test test test test test junk'
  }
  return mnemonic
}

/**
 * get the account
 * @param networkName
 * @returns
 */
export function account(networkName?: string): { mnemonic: string } {
  return { mnemonic: getMnemonic(networkName) }
}
