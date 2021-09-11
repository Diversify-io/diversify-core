import '@nomiclabs/hardhat-ethers'
import '@nomiclabs/hardhat-waffle'
import '@openzeppelin/hardhat-upgrades'
import '@typechain/hardhat'
import 'hardhat-gas-reporter'
import 'solidity-coverage'
require('dotenv').config()
/**
 * @type import('hardhat/config').HardhatUserConfig
 */
// (process.env.REPORT_GAS)
export default {
  networks: {
    hardhat: {},
    ganache: {
      url: 'http://127.0.0.1:7545',
    },
    rinkeby: {
      url: `https://eth-rinkeby.alchemyapi.io/v2/${process.env.ALCHEMY_API_KEY}`,
      accounts: [`0x${process.env.RINKEBY_PRIVATE_KEY}`],
    },
  },
  gasReporter: {
    enabled: false,
    currency: 'EUR',
    coinmarketcap: `${process.env.COIN_MARKET_CAPI_KEY}`,
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
}
