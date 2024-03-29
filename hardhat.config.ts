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
      goerli: '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65',
      polygonMumbai: '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65',
      polygon: '0xc078085103D2CcA519CC1AB3F362C2F0b134Ff67',
    },
    strategicSale: {
      default: 2,
      mainnet: '0x92DC957C903D3223Bc4AB3034896FeE47e71c5a6',
      rinkeby: '0xd457B03b6650EFC95ffd6387797705eE41B21C29',
      goerli: '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65',
      polygonMumbai: '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65',
      polygon: '0xc078085103D2CcA519CC1AB3F362C2F0b134Ff67',
    },
    foundation: {
      default: 3,
      mainnet: '0xf74c31591Eec496AB02b052E36b678012381F0A0',
      rinkeby: '0x529980Be29B38f132B4DefcAcA787D0Ca313A3fc',
      goerli: '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65',
      polygonMumbai: '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65',
      polygon: '0xaF7743f34ed8513e6AB738Dfb04C2d247F40Ef9a',
    },
    dev: {
      default: 4,
      mainnet: '0x503B0a370fF60Ed457045B61Ba3E17622FF8A1E6',
      rinkeby: '0xc23C545cFfFb2c548fade31E4A2b1621211e216b',
      goerli: '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65',
      polygonMumbai: '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65',
      polygon: '0xc078085103D2CcA519CC1AB3F362C2F0b134Ff67',
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
    goerli: {
      chainId: 5,
      url: node_url('goerli'),
      accounts: account('goerli'),
      gasMultiplier: 2,
      gas: 2100000,
      gasPrice: 8000000000,
      timeout: 50000,
    },
    polygon: {
      chainId: 137,
      url: node_url('polygon-mainnet'),
      accounts: account('polygon'),
      gasPrice: 35 * 1000000000,
      gas: 2100000,
      gasMultiplier: 2,
      timeout: 50000,
    },
    polygonMumbai: {
      chainId: 80001,
      url: node_url('polygon-mumbai'),
      accounts: account('polygonMumbai'),
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
    apiKey: {
      mainnet: process.env.ETHERSCAN_API_KEY,
      ropsten: process.env.ETHERSCAN_API_KEY,
      rinkeby: process.env.ETHERSCAN_API_KEY,
      goerli: process.env.ETHERSCAN_API_KEY,
      kovan: process.env.ETHERSCAN_API_KEY,
      // polygon
      polygon: process.env.POLYGONSCAN_API_KEY,
      polygonMumbai: process.env.POLYGONSCAN_API_KEY,
    },
  },
  solidity: {
    compilers: [
      {
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
      {
        version: '0.8.17',
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
    ],
  },
  // solidity: {
  //   version: '0.8.17',
  //   settings: {
  //     optimizer: {
  //       enabled: true,
  //       runs: 800,
  //     },
  //     metadata: {
  //       // do not include the metadata hash, since this is machine dependent
  //       // and we want all generated code to be deterministic
  //       // https://docs.soliditylang.org/en/v0.7.6/metadata.html
  //       bytecodeHash: 'none',
  //     },
  //   },
  // },
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
