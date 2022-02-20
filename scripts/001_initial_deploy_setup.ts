import chalk from 'chalk'
import hre, { ethers, getNamedAccounts, upgrades } from 'hardhat'
import moment from 'moment'
import { daysToSeconds, getSecondsBetweenDates } from '../test/helpers/time'
import { SeedSaleRound__factory } from '../types/factories/SeedSaleRound__factory'
import { TimelockedIntervalReleasedTokenVault__factory } from '../types/factories/TimelockedIntervalReleasedTokenVault__factory'
import { TimelockedTokenVault__factory } from '../types/factories/TimelockedTokenVault__factory'
import { UpgradableCommunityRewardDistributorV1__factory } from '../types/factories/UpgradableCommunityRewardDistributorV1__factory'
import { UpgradableDiversifyV1__factory } from '../types/factories/UpgradableDiversifyV1__factory'
import { UpgradablePublicSaleDistributorV1__factory } from '../types/factories/UpgradablePublicSaleDistributorV1__factory'
import {
  deployContract,
  deployProxy,
  etherscanVerify,
  getSavedContractAddresses,
  saveContractAddress,
  transferOwnership,
} from '../utils/deploy'

// Initial deployment script
async function deploy() {
  // Make sure that we have the actual files
  await hre.run('clean')
  await hre.run('compile')

  // Constants
  const { deployer, company, strategicSale, foundation, dev } = await getNamedAccounts()
  const deployerWithSigner = await ethers.getSigner(deployer)
  const networkName = hre.network.name

  // Supply
  const TOTAL_SUPPLY = 1000000000
  const COMPANY_SUPPLY_PERCENTAGE = 2.5
  const PROJECT_SUPPLY_PERCENTAGE = 9
  const TEAM_SUPPLY_PERCENTAGE = 9
  const COMMUNITY_SUPPLY_PERCENTAGE = 17.5
  const SEED_SALE_SUPPLY_PERCENTAGE = 2
  const STRATEGIC_SALE_SUPPLY_PERCENTAGE = 10
  const GLOBAL_SALE_SUPPLY_1_PERCENTAGE = 20
  const GLOBAL_SALE_SUPPLY_2_PERCENTAGE = 20
  const GLOBAL_SALE_SUPPLY_3_PERCENTAGE = 10

  // Vaults
  const PROJECT_VAULT_DURATION = daysToSeconds(5 * 365) // 5 years (60 months)
  const PROJECT_VAULT_INTERVAL = daysToSeconds(182.5) // every 6 months
  const TEAM_VAULT_DURATION = daysToSeconds(2.5 * 365) // 2.5 years (30 months)
  const TEAM_VAULT_INTERVAL = daysToSeconds(91.25) // every 3 months
  const COMMUNITY_VAULT_DURATION = daysToSeconds(11 * 365) // 11 years (132 monate)
  const COMMUNITY_VAULT_INTERVAL = daysToSeconds(365) // every year
  const GLOBAL_SALE_VAULT_1_DURATION = getSecondsBetweenDates(moment(), '2022-06-02')
  const GLOBAL_SALE_VAULT_2_DURATION = getSecondsBetweenDates(moment(), '2023-06-02')
  const GLOBAL_SALE_VAULT_3_DURATION = getSecondsBetweenDates(moment(), '2024-06-02')
  const STRATEGIC_SALE_VAULT_DURATION = networkName.includes('polygon')
    ? getSecondsBetweenDates(moment(), '2022-03-01')
    : getSecondsBetweenDates(moment(), '2022-01-01')

  // Start Deployment
  console.log(' 📡 Deploying to network:', networkName)
  console.log(' 👤 Deploying contracts with the account:', chalk.magenta(deployer))
  console.log(' 💰 Account balance:', chalk.green((await deployerWithSigner.getBalance()).toString()))

  // Deploy: Project Vault (TimelockedIntervalReleasedTokenVault)
  const projectVault = await deployContract<TimelockedIntervalReleasedTokenVault__factory>(
    'projectVault',
    'TimelockedIntervalReleasedTokenVault',
    company,
    PROJECT_VAULT_DURATION,
    PROJECT_VAULT_INTERVAL
  )

  // Deploy: Team Vault (TimelockedIntervalReleasedTokenVault)
  const teamVault = await deployContract<TimelockedIntervalReleasedTokenVault__factory>(
    'teamVault',
    'TimelockedIntervalReleasedTokenVault',
    company,
    TEAM_VAULT_DURATION,
    TEAM_VAULT_INTERVAL
  )

  // Deploy: CommunityRewardDistributor
  const communityDistributorProxy = await deployProxy<UpgradableCommunityRewardDistributorV1__factory>(
    'communityDistributorProxy',
    'UpgradableCommunityRewardDistributor_V1'
  )

  // Deploy: CommunityRewardVault (TimelockedIntervalReleasedTokenVault)
  const communityVault = await deployContract<TimelockedIntervalReleasedTokenVault__factory>(
    'communityVault',
    'TimelockedIntervalReleasedTokenVault',
    communityDistributorProxy.address,
    COMMUNITY_VAULT_DURATION,
    COMMUNITY_VAULT_INTERVAL
  )

  // Deploy: SeedSale Round
  const seedSaleRound = await deployContract<SeedSaleRound__factory>('seedSaleRound', 'SeedSaleRound')

  // Deploy: StrategicSale
  const strategicSaleVault = await deployContract<TimelockedTokenVault__factory>(
    'strategicSaleVault',
    'TimelockedTokenVault',
    strategicSale,
    STRATEGIC_SALE_VAULT_DURATION
  )

  // Deploy: publicSaleDistributorProxy
  const publicSaleDistributorProxy = await deployProxy<UpgradablePublicSaleDistributorV1__factory>(
    'publicSaleDistributorProxy',
    'UpgradablePublicSaleDistributor_V1'
  )

  // Deploy: globalSaleVault1
  const globalSaleVault1 = await deployContract<TimelockedTokenVault__factory>(
    'globalSaleVault1',
    'TimelockedTokenVault',
    publicSaleDistributorProxy.address,
    GLOBAL_SALE_VAULT_1_DURATION
  )

  // Deploy: globalSaleVault2
  const globalSaleVault2 = await deployContract<TimelockedTokenVault__factory>(
    'globalSaleVault2',
    'TimelockedTokenVault',
    publicSaleDistributorProxy.address,
    GLOBAL_SALE_VAULT_2_DURATION
  )

  // Deploy: globalSaleVault3
  const globalSaleVault3 = await deployContract<TimelockedTokenVault__factory>(
    'globalSaleVault3',
    'TimelockedTokenVault',
    publicSaleDistributorProxy.address,
    GLOBAL_SALE_VAULT_3_DURATION
  )

  // Deploy: Token
  const totalSupplyPercentage = TOTAL_SUPPLY / 100
  const supplyMap = new Map([
    [projectVault.address, totalSupplyPercentage * PROJECT_SUPPLY_PERCENTAGE],
    [teamVault.address, totalSupplyPercentage * TEAM_SUPPLY_PERCENTAGE],
    [communityVault.address, totalSupplyPercentage * COMMUNITY_SUPPLY_PERCENTAGE],
    [globalSaleVault1.address, totalSupplyPercentage * GLOBAL_SALE_SUPPLY_1_PERCENTAGE],
    [globalSaleVault2.address, totalSupplyPercentage * GLOBAL_SALE_SUPPLY_2_PERCENTAGE],
    [globalSaleVault3.address, totalSupplyPercentage * GLOBAL_SALE_SUPPLY_3_PERCENTAGE],
    [strategicSaleVault.address, totalSupplyPercentage * STRATEGIC_SALE_SUPPLY_PERCENTAGE],
    [seedSaleRound.address, totalSupplyPercentage * SEED_SALE_SUPPLY_PERCENTAGE],
    [company, totalSupplyPercentage * COMPANY_SUPPLY_PERCENTAGE],
  ])

  const divTokenProxy = await deployProxy<UpgradableDiversifyV1__factory>(
    'divTokenProxy',
    'UpgradableDiversify_V1',
    [...supplyMap.keys()],
    [...supplyMap.values()],
    foundation,
    communityDistributorProxy.address
  )

  const { address: DIV_TOKEN_ADDRESS } = divTokenProxy

  // Set Distributor Token
  await communityDistributorProxy.setToken(DIV_TOKEN_ADDRESS)
  await publicSaleDistributorProxy.setToken(DIV_TOKEN_ADDRESS)

  // Start Vaults
  console.log(' 🏛️  Starting the vaults...')
  await projectVault.start(DIV_TOKEN_ADDRESS)
  await teamVault.start(DIV_TOKEN_ADDRESS)
  await communityVault.start(DIV_TOKEN_ADDRESS)
  await strategicSaleVault.start(DIV_TOKEN_ADDRESS)
  await globalSaleVault1.start(DIV_TOKEN_ADDRESS)
  await globalSaleVault2.start(DIV_TOKEN_ADDRESS)
  await globalSaleVault3.start(DIV_TOKEN_ADDRESS)
  console.log(' 🏆  Vaults started')

  // Transfer Ownership
  await transferOwnership('projectVault', projectVault, company)
  await transferOwnership('teamVault', teamVault, company)
  await transferOwnership('communityDistributorProxy', communityDistributorProxy, company)
  await transferOwnership('publicSaleDistributorProxy', publicSaleDistributorProxy, company)
  await transferOwnership('communityVault', communityVault, company)
  await transferOwnership('seedSaleRound', seedSaleRound, company)
  await transferOwnership('strategicSaleVault', strategicSaleVault, company)
  await transferOwnership('globalSaleVault1', globalSaleVault1, company)
  await transferOwnership('globalSaleVault2', globalSaleVault2, company)
  await transferOwnership('globalSaleVault3', globalSaleVault3, company)
  await transferOwnership('divTokenProxy', divTokenProxy, company)

  // Transfer Ownerships to dev
  console.log(' 👮 Transferring ownership of ProxyAdmin...')
  await upgrades.admin.transferProxyAdminOwnership(dev)
  console.log(' 🔐 Transferred ownership of ProxyAdmin to:', dev)

  // Verification
  const contractAddress = getSavedContractAddresses()
  const networkAdresses = contractAddress[networkName]
  for (const key of Object.keys(networkAdresses)) {
    const contract = networkAdresses[key]
    const address = contract.type === 'proxy' ? contract.implementation.address : contract.address
    const src = contract.type === 'proxy' ? contract.implementation.src : contract.meta.src
    const args = contract.type === 'proxy' ? [] : contract.meta.args ?? [] // upgradable contracts use initalize functions -> no constructor
    try {
      await etherscanVerify(key, address, args, src)
      saveContractAddress(networkName, {
        ...contract,
        verified: true,
      })
    } catch (e) {
      console.log(e)
    }
  }

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
