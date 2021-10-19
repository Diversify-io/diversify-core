import hre, { ethers, getNamedAccounts, upgrades } from 'hardhat'
import { SeedSaleRound__factory } from '../types/factories/SeedSaleRound__factory'
import { TimelockedIntervalReleasedTokenVault__factory } from '../types/factories/TimelockedIntervalReleasedTokenVault__factory'
import { TimelockedTokenVault__factory } from '../types/factories/TimelockedTokenVault__factory'
import { UpgradableCommunityRewardDistributorV1__factory } from '../types/factories/UpgradableCommunityRewardDistributorV1__factory'
import { UpgradableDiversifyV1__factory } from '../types/factories/UpgradableDiversifyV1__factory'
import { UpgradablePublicSaleDistributorV1__factory } from '../types/factories/UpgradablePublicSaleDistributorV1__factory'
import { deployContract, deployProxy, getContractFactory, transferOwnership } from '../utils/deploy'

// Initial deployment script
async function deploy() {
  // Make sure that we have the actual files
  await hre.run('clean')
  await hre.run('compile')

  // Constants
  const { deployer, company, strategicSale, foundation, dev } = await getNamedAccounts()
  const deployerWithSigner = await ethers.getSigner(deployer)

  // Supply
  const TOTAL_SUPPLY = 1000000000
  const COMPANY_SUPPLY_PERCENTAGE = 2.5
  const PROJECT_SUPPLY_PERCENTAGE = 9
  const TEAM_SUPPLY_PERCENTAGE = 9
  const COMMUNITY_SUPPLY_PERCENTAGE = 17.5
  const SEED_SALE_SUPPLY_PERCENTAGE = 2
  const STRATEGIC_SALE_SUPPLY_PERCENTAGE = 10
  const GLOBAL_SALE_SUPPLY_PERCENTAGE = 50

  // Vaults
  const PROJECT_VAULT_DURATION = 157680000
  const PROJECT_VAULT_INTERVAL = 15768000
  const TEAM_VAULT_DURATION = 78840000
  const TEAM_VAULT_INTERVAL = 7884000
  const COMMUNITY_VAULT_DURATION = 346896000
  const COMMUNITY_VAULT_INTERVAL = 31536000
  const STRATEGIC_SALE_VAULT_DURATION = 10 // TODO: Insert Duration
  const GLOBAL_SALE_VAULT_DURATION = 10 // TODO: Insert Duration

  // Contracts
  const TimelockedIntervalReleasedTokenVault = await getContractFactory<TimelockedIntervalReleasedTokenVault__factory>(
    'TimelockedIntervalReleasedTokenVault'
  )
  const TimelockedTokenVault = await getContractFactory<TimelockedTokenVault__factory>('TimelockedTokenVault')
  const UpgradableCommunityRewardDistributorV1 =
    await getContractFactory<UpgradableCommunityRewardDistributorV1__factory>('UpgradableCommunityRewardDistributor_V1')
  const UpgradableDiversifyV1 = await getContractFactory<UpgradableDiversifyV1__factory>('UpgradableDiversify_V1')
  const UpgradablePublicSaleDistributorV1 = await getContractFactory<UpgradablePublicSaleDistributorV1__factory>(
    'UpgradablePublicSaleDistributor_V1'
  )
  const SeedSaleRound = await getContractFactory<SeedSaleRound__factory>('SeedSaleRound')

  // Start Deployment
  console.log('Deploying to network:', hre.network.name)
  console.log('Deploying contracts with the account:', deployer)
  console.log('Account balance:', (await deployerWithSigner.getBalance()).toString())

  // Deploy: Project Vault (TimelockedIntervalReleasedTokenVault)
  const projectVault = await deployContract(
    'projectVault',
    TimelockedIntervalReleasedTokenVault,
    company,
    PROJECT_VAULT_DURATION,
    PROJECT_VAULT_INTERVAL
  )

  // Deploy: Team Vault (TimelockedIntervalReleasedTokenVault)
  const teamVault = await deployContract(
    'teamVault',
    TimelockedIntervalReleasedTokenVault,
    company,
    TEAM_VAULT_DURATION,
    TEAM_VAULT_INTERVAL
  )

  // Deploy: CommunityRewardDistributor
  const communityDistributorProxy = await deployProxy(
    'communityDistributorProxy',
    UpgradableCommunityRewardDistributorV1
  )

  // Deploy: CommunityRewardVault (TimelockedIntervalReleasedTokenVault)
  const communityVault = await deployContract(
    'communityVault',
    TimelockedIntervalReleasedTokenVault,
    communityDistributorProxy.address,
    COMMUNITY_VAULT_DURATION,
    COMMUNITY_VAULT_INTERVAL
  )

  // Deploy: SeedSale Round
  const seedSaleRound = await deployContract('seedSaleRound', SeedSaleRound)

  // Deploy: StrategicSale
  const strategicSaleVault = await deployContract(
    'strategicSaleVault',
    TimelockedTokenVault,
    strategicSale,
    STRATEGIC_SALE_VAULT_DURATION
  )

  // Deploy: publicSaleDistributorProxy
  const publicSaleDistributorProxy = await deployProxy('publicSaleDistributorProxy', UpgradablePublicSaleDistributorV1)

  // Deploy: globalSaleVault
  const globalSaleVault = await deployContract(
    'globalSaleVault',
    TimelockedTokenVault,
    publicSaleDistributorProxy.address,
    GLOBAL_SALE_VAULT_DURATION
  )

  // Deploy: Token
  const totalSupplyPercentage = TOTAL_SUPPLY / 100
  const supplyMap = new Map([
    [projectVault.address, totalSupplyPercentage * PROJECT_SUPPLY_PERCENTAGE],
    [teamVault.address, totalSupplyPercentage * TEAM_SUPPLY_PERCENTAGE],
    [communityVault.address, totalSupplyPercentage * COMMUNITY_SUPPLY_PERCENTAGE],
    [globalSaleVault.address, totalSupplyPercentage * GLOBAL_SALE_SUPPLY_PERCENTAGE],
    [strategicSaleVault.address, totalSupplyPercentage * STRATEGIC_SALE_SUPPLY_PERCENTAGE],
    [seedSaleRound.address, totalSupplyPercentage * SEED_SALE_SUPPLY_PERCENTAGE],
    [company, totalSupplyPercentage * COMPANY_SUPPLY_PERCENTAGE],
  ])

  const divTokenProxy = await deployProxy(
    'divTokenProxy',
    UpgradableDiversifyV1,
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
  await projectVault.start(DIV_TOKEN_ADDRESS)
  await teamVault.start(DIV_TOKEN_ADDRESS)
  await communityVault.start(DIV_TOKEN_ADDRESS)
  await strategicSaleVault.start(DIV_TOKEN_ADDRESS)
  await globalSaleVault.start(DIV_TOKEN_ADDRESS)

  // Transfer Ownership
  await transferOwnership('projectVault', projectVault, company)
  await transferOwnership('teamVault', teamVault, company)
  await transferOwnership('communityDistributorProxy', communityDistributorProxy, company)
  await transferOwnership('communityVault', communityVault, company)
  await transferOwnership('seedSaleRound', seedSaleRound, company)
  await transferOwnership('strategicSaleVault', strategicSaleVault, company)
  await transferOwnership('globalSaleVault', globalSaleVault, company)
  await transferOwnership('divTokenProxy', divTokenProxy, company)

  // Transfer Ownerships to dev
  console.log('Transferring ownership of ProxyAdmin...')
  await upgrades.admin.transferProxyAdminOwnership(dev)
  console.log('Transferred ownership of ProxyAdmin to:', dev)
}

// execute main
deploy()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
