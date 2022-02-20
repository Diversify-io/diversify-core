import { parseEther } from '@ethersproject/units'
import chalk from 'chalk'
import hre, { ethers, getNamedAccounts } from 'hardhat'
import moment from 'moment'
import { daysToSeconds } from '../../test/helpers/time'
import { UpgradableDiversifyV1__factory } from '../../types'
import { SeedSaleRound__factory } from '../../types/factories/SeedSaleRound__factory'
import { deployContract, deployProxy } from '../../utils/deploy'

// Initial deployment script
async function deploy() {
  // Make sure that we have the actual files
  await hre.run('clean')
  await hre.run('compile')

  // Constants
  const { deployer, company } = await getNamedAccounts()
  const deployerWithSigner = await ethers.getSigner(deployer)
  const networkName = hre.network.name

  // Start Deployment
  console.log(' 📡 Deploying to network:', networkName)
  console.log(' 👤 Deploying contracts with the account:', chalk.magenta(deployer))
  console.log(' 💰 Account balance:', chalk.green((await deployerWithSigner.getBalance()).toString()))

  // Deploy: SeedSale Round
  const seedSaleRound = await deployContract<SeedSaleRound__factory>('seedSaleRound', 'SeedSaleRound')

  // Deploy DivToken
  const divTokenProxy = await deployProxy<UpgradableDiversifyV1__factory>(
    'divTokenProxy',
    'UpgradableDiversify_V1',
    [seedSaleRound.address],
    [10000000],
    company,
    company
  )

  // Start SeedSale Round
  await seedSaleRound.setup(
    company,
    moment().add(1, 'year').unix(),
    daysToSeconds(30),
    daysToSeconds(45),
    1000,
    parseEther('5'),
    50,
    1000000,
    divTokenProxy.address
  )
  console.log(' 💰 Seed Sale round setup')

  // Start the mission
  console.log(chalk.grey('==========='))
  console.log(chalk.green(' 🚀  Mission Modern Investing started!'))
  console.log(chalk.grey('==========='))
}

// execute main
deploy()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
