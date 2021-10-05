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
  const { deployer, company, privateSeedSale, foundation, dev } = await getNamedAccounts()
  const deployerWithSigner = await ethers.getSigner(deployer)

  // Supply
  const TOTAL_SUPPLY = 1000000000
  const PR_SUPPLY_PERCENTAGE = 10
  const TA_SUPPLY_PERCENTAGE = 10
  const COMMUNITY_SUPPLY_PERCENTAGE = 17.5
  const SEED_SALE_ROUND_1_SUPPLY_PERCENTAGE = 0.25
  const SEED_SALE_ROUND_2_SUPPLY_PERCENTAGE = 2.25
  const PRIVATE_SALE_SUPPLY_PERCENTAGE = 10
  const PUBLIC_SALE_SUPPLY_PERCENTAGE = 50

  // Vaults
  const PR_VAULT_DURATION = 10
  const PR_VAULT_INTERVAL = 10
  const TA_VAULT_DURATION = 10
  const TA_VAULT_INTERVAL = 10
  const COMMUNITY_VAULT_DURATION = 10
  const COMMUNITY_VAULT_INTERVAL = 10
  const PRIVATE_SEED_SALE_VAULT_DURATION = 10
  const PUBLIC_SEED_SALE_VAULT_DURATION = 10

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

  // Deploy: PR Vault (TimelockedIntervalReleasedTokenVault)
  const prVault = await deployContract(
    'prVault',
    TimelockedIntervalReleasedTokenVault,
    company,
    PR_VAULT_DURATION,
    PR_VAULT_INTERVAL
  )

  // Deploy: T & A Vault (TimelockedIntervalReleasedTokenVault)
  const taVault = await deployContract(
    'taVault',
    TimelockedIntervalReleasedTokenVault,
    company,
    TA_VAULT_DURATION,
    TA_VAULT_INTERVAL
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

  // Deploy: SeedSale Round 1
  const seedSaleRound1 = await deployContract('seedSaleRound1', SeedSaleRound)

  // Deploy: SeedSale Round 2
  const seedSaleRound2 = await deployContract('seedSaleRound2', SeedSaleRound)

  // Deploy: PrivateSale
  const privateSaleVault = await deployContract(
    'privateSaleVault',
    TimelockedTokenVault,
    privateSeedSale,
    PRIVATE_SEED_SALE_VAULT_DURATION
  )

  // Deploy: publicSaleDistributorProxy
  const publicSaleDistributorProxy = await deployProxy('publicSaleDistributorProxy', UpgradablePublicSaleDistributorV1)

  // Deploy: publicSaleVault
  const publicSaleVault = await deployContract(
    'publicSaleVault',
    TimelockedTokenVault,
    publicSaleDistributorProxy.address,
    PUBLIC_SEED_SALE_VAULT_DURATION
  )

  // Deploy: Token
  const totalSupplyPercentage = TOTAL_SUPPLY / 100
  const supplyMap = new Map([
    [prVault.address, totalSupplyPercentage * PR_SUPPLY_PERCENTAGE],
    [taVault.address, totalSupplyPercentage * TA_SUPPLY_PERCENTAGE],
    [communityVault.address, totalSupplyPercentage * COMMUNITY_SUPPLY_PERCENTAGE],
    [publicSaleVault.address, totalSupplyPercentage * PUBLIC_SALE_SUPPLY_PERCENTAGE],
    [privateSaleVault.address, totalSupplyPercentage * PRIVATE_SALE_SUPPLY_PERCENTAGE],
    [seedSaleRound1.address, totalSupplyPercentage * SEED_SALE_ROUND_1_SUPPLY_PERCENTAGE],
    [seedSaleRound2.address, totalSupplyPercentage * SEED_SALE_ROUND_2_SUPPLY_PERCENTAGE],
  ])

  const divTokenProxy = await deployProxy(
    'divTokenProxy',
    UpgradableDiversifyV1,
    [...supplyMap.keys()],
    [...supplyMap.values()],
    foundation
  )

  const { address: DIV_TOKEN_ADDRESS } = divTokenProxy

  // Set Distributor Token
  await communityDistributorProxy.setToken(DIV_TOKEN_ADDRESS)
  await publicSaleDistributorProxy.setToken(DIV_TOKEN_ADDRESS)

  // Start Vaults
  await prVault.start(DIV_TOKEN_ADDRESS)
  await taVault.start(DIV_TOKEN_ADDRESS)
  await communityVault.start(DIV_TOKEN_ADDRESS)
  await privateSaleVault.start(DIV_TOKEN_ADDRESS)
  await publicSaleVault.start(DIV_TOKEN_ADDRESS)

  // Transfer Ownership
  await transferOwnership('prVault', prVault, company)
  await transferOwnership('taVault', taVault, company)
  await transferOwnership('communityDistributorProxy', communityDistributorProxy, company)
  await transferOwnership('communityVault', communityVault, company)
  await transferOwnership('seedSaleRound1', seedSaleRound1, company)
  await transferOwnership('seedSaleRound2', seedSaleRound2, company)
  await transferOwnership('privateSaleVault', privateSaleVault, company)
  await transferOwnership('publicSaleVault', publicSaleVault, company)
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
