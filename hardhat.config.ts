import '@nomiclabs/hardhat-ethers'
import '@nomiclabs/hardhat-etherscan'
import '@nomiclabs/hardhat-waffle'
import '@openzeppelin/hardhat-upgrades'
import '@tenderly/hardhat-tenderly'
import '@typechain/hardhat'
import 'hardhat-abi-exporter'
import 'hardhat-contract-sizer'
import 'hardhat-gas-reporter'
import { removeConsoleLog } from 'hardhat-preprocessor'
import 'hardhat-spdx-license-identifier'
import 'hardhat-watcher'
import { HardhatUserConfig } from 'hardhat/types'
import 'solidity-coverage'
import './extensions/hardhat/index'
import { account, node_url } from './utils/network'
require('dotenv').config()

const config: HardhatUserConfig = {
  defaultNetwork: 'hardhat',
  namedAccounts: {
    deployer: {
      default: 0, // here this will by default take the first account as deployer
      mainnet: 0, // similarly on mainnet it will take the first account as deployer. Note though that depending on how hardhat network are configured, the account 0 on one network can be different than on another
      rinkeby: '0x84b9514E013710b9dD0811c9Fe46b837a4A0d8E0', //it can also specify a specific netwotk name (specified in hardhat.config.js)
    },
    company: {
      default: 1, // here this will by default take the first account as deployer
    },
    privateSeedSale: {
      default: 2, // here this will by default take the first account as deployer
    },
    foundation: {
      default: 3, // here this will by default take the first account as deployer
    },
    dev: {
      default: 4, // here this will by default take the second account as feeCollector (so in the test this will be a different account than the deployer)
    },
  },
  networks: {
    mainnet: {
      url: node_url('mainnet'),
      accounts: account('mainnet'),
    },
    rinkeby: {
      url: node_url('rinkeby'),
      accounts: account('rinkeby'),
    },
    hardhat: {
      forking: {
        enabled: process.env.FORKING === 'true',
        url: `https://eth-mainnet.alchemyapi.io/v2/${process.env.ALCHEMY_API_KEY}`,
      },
    },
    ganache: {
      url: 'http://127.0.0.1:7545',
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
  abiExporter: {
    path: './abi',
    clear: false,
    flat: true,
    // only: [],
    // except: []
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
  tenderly: {
    project: process.env.TENDERLY_PROJECT!,
    username: process.env.TENDERLY_USERNAME!,
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS === 'true',
    currency: 'USD',
    coinmarketcap: process.env.COIN_MARKET_CAPI_KEY,
    excludeContracts: ['contracts/mocks/'],
  },
}

export default config
