import { extendConfig, extendEnvironment } from 'hardhat/config'
import { HardhatConfig, HardhatRuntimeEnvironment, HardhatUserConfig } from 'hardhat/types'
import './type-extensions'
import { parseNamedAccounts } from './utils'

extendConfig((config: HardhatConfig, userConfig: Readonly<HardhatUserConfig>) => {
  if (userConfig.namedAccounts) {
    config.namedAccounts = userConfig.namedAccounts
  } else {
    config.namedAccounts = {}
  }
})

extendEnvironment((hre: HardhatRuntimeEnvironment) => {
  hre.getNamedAccounts = () => parseNamedAccounts(hre)
})
