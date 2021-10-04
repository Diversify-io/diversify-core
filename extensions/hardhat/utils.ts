import { HardhatRuntimeEnvironment } from 'hardhat/types'

const parseNamedAccounts = async (
  hre: HardhatRuntimeEnvironment
): Promise<{
  [name: string]: string
}> => {
  const namedAccounts: { [name: string]: string } = {}
  const chainName = hre.network.name
  const configNamedAccounts = hre.config.namedAccounts
  const accountNames = Object.keys(configNamedAccounts)
  const accounts = await hre.network.provider.send('eth_accounts')
  const resolveAddress = (spec: string | number | { [network: string]: null | number | string }): string => {
    let address = ''

    switch (typeof spec) {
      case 'string':
        address = spec
        break
      case 'number':
        address = accounts[spec]
        break
      case 'object':
        const chainObj = spec[chainName]
        if (chainObj == null) {
          address = resolveAddress(spec['default'] ?? '')
        } else {
          address = resolveAddress(chainObj)
        }
        break
    }
    return address
  }
  for (const accountName of accountNames) {
    const spec = configNamedAccounts[accountName]
    const address = resolveAddress(spec)
    if (address) {
      namedAccounts[accountName] = address
    }
  }
  return namedAccounts
}

export { parseNamedAccounts }
