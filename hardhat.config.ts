import '@nomiclabs/hardhat-ethers'
import '@nomiclabs/hardhat-waffle'
import '@openzeppelin/hardhat-upgrades'
import '@typechain/hardhat'
import 'hardhat-gas-reporter'
import 'solidity-coverage'

const ALCHEMY_API_KEY = 'rXd2olfndKqJLkB5X0SV8-FZkI2diQVo'
const RINKEBY_PRIVATE_KEY = 'd7b50a2df201b3d0365df563564e9e0740261f490ea163671b70e7f2636cee05'

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
      url: `https://eth-rinkeby.alchemyapi.io/v2/${ALCHEMY_API_KEY}`,
      accounts: [`0x${RINKEBY_PRIVATE_KEY}`],
    },
  },
  gasReporter: {
    enabled: true,
    currency: 'EUR',
    coinmarketcap: '65ffafbd-6108-491c-8be3-b858dfa4e9e1',
    gasPrice: 21,
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
