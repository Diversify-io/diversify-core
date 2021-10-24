import '@nomiclabs/hardhat-ethers'
import '@nomiclabs/hardhat-etherscan'
import '@nomiclabs/hardhat-waffle'
import '@openzeppelin/hardhat-upgrades'
import '@typechain/hardhat'
import 'hardhat-contract-sizer'
import 'hardhat-gas-reporter'
import { removeConsoleLog } from 'hardhat-preprocessor'
import 'hardhat-spdx-license-identifier'
import 'hardhat-watcher'
import { task } from 'hardhat/config'
import { HardhatUserConfig } from 'hardhat/types'
import 'solidity-coverage'
import './extensions/hardhat/index'
import { account, node_url } from './utils/network'
require('dotenv').config()

const config: HardhatUserConfig = {
  defaultNetwork: 'hardhat',
  namedAccounts: {
    deployer: {
      default: 0, // Always first account
    },
    company: {
      default: 1,
      mainnet: '0x92DC957C903D3223Bc4AB3034896FeE47e71c5a6',
      rinkeby: '0xd457B03b6650EFC95ffd6387797705eE41B21C29',
    },
    strategicSale: {
      default: 2,
      mainnet: '0x92DC957C903D3223Bc4AB3034896FeE47e71c5a6',
      rinkeby: '0xd457B03b6650EFC95ffd6387797705eE41B21C29',
    },
    foundation: {
      default: 3,
      mainnet: '0xf74c31591Eec496AB02b052E36b678012381F0A0',
      rinkeby: '0x529980Be29B38f132B4DefcAcA787D0Ca313A3fc',
    },
    dev: {
      default: 4,
      mainnet: '0x503B0a370fF60Ed457045B61Ba3E17622FF8A1E6',
      rinkeby: '0xc23C545cFfFb2c548fade31E4A2b1621211e216b',
    },
  },
  networks: {
    mainnet: {
      chainId: 1,
      url: node_url('mainnet'),
      accounts: account('mainnet'),
      gasPrice: 65 * 1000000000,
      gasMultiplier: 2,
      timeout: 50000,
    },
    rinkeby: {
      chainId: 4,
      url: node_url('rinkeby'),
      accounts: account('rinkeby'),
      gasPrice: 5000000000,
      gasMultiplier: 2,
      timeout: 50000,
    },
    hardhat: {
      chainId: 1337,
      forking: {
        enabled: process.env.FORKING === 'true',
        url: `https://eth-mainnet.alchemyapi.io/v2/${process.env.ALCHEMY_API_KEY}`,
      },
    },
    localhost: {
      url: 'http://127.0.0.1:8545',
    },
  },
  etherscan: {
    // Your API key for Etherscan
    // Obtain one at https://etherscan.io/
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
  solidity: {
    version: '0.8.4',
    settings: {
      optimizer: {
        enabled: true,
        runs: 800,
      },
      metadata: {
        // do not include the metadata hash, since this is machine dependent
        // and we want all generated code to be deterministic
        // https://docs.soliditylang.org/en/v0.7.6/metadata.html
        bytecodeHash: 'none',
      },
    },
  },
  typechain: {
    outDir: 'types',
    target: 'ethers-v5',
  },
  contractSizer: {
    alphaSort: true,
    disambiguatePaths: false,
    strict: true,
  },
  preprocess: {
    eachLine: removeConsoleLog((bre) => bre.network.name !== 'hardhat' && bre.network.name !== 'localhost'),
  },
  spdxLicenseIdentifier: {
    overwrite: false,
    runOnCompile: true,
  },
  watcher: {
    compile: {
      tasks: ['compile'],
      files: ['./contracts'],
      verbose: true,
    },
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS === 'true',
    currency: 'USD',
    coinmarketcap: process.env.COINMARKETCAP_API_KEY,
    excludeContracts: ['contracts/mocks/'],
  },
}

export default config

task('accounts', 'Prints the list of accounts', async (_, { ethers }) => {
  const accounts = await ethers.provider.listAccounts()
  accounts.forEach((account) => console.log(account))
})
