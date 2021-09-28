import '@nomiclabs/hardhat-ethers'
import '@nomiclabs/hardhat-etherscan'
import '@nomiclabs/hardhat-waffle'
import '@openzeppelin/hardhat-upgrades'
import '@tenderly/hardhat-tenderly'
import '@typechain/hardhat'
import 'hardhat-abi-exporter'
import 'hardhat-gas-reporter'
import { removeConsoleLog } from 'hardhat-preprocessor'
import 'hardhat-spdx-license-identifier'
import 'hardhat-watcher'
import 'solidity-coverage'
require('dotenv').config()

export default {
  defaultNetwork: 'hardhat',
  networks: {
    hardhat: {},
    ganache: {
      url: 'http://127.0.0.1:7545',
    },
    rinkeby: {
      url: `https://rinkeby.infura.io/v3/${process.env.INFURA_API_KEY}`,
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
