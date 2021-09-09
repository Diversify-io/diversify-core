import { ethers, upgrades } from 'hardhat'
import { SeedSaleRound__factory } from '../typechain/factories/SeedSaleRound__factory'
import { TimelockedIntervalReleasedTokenVault__factory } from '../typechain/factories/TimelockedIntervalReleasedTokenVault__factory'
import { TimelockedTokenVault__factory } from '../typechain/factories/TimelockedTokenVault__factory'
import { UpgradableCommunityRewardDistributorV1__factory } from '../typechain/factories/UpgradableCommunityRewardDistributorV1__factory'
import { UpgradableDiversifyV1__factory } from '../typechain/factories/UpgradableDiversifyV1__factory'
import { UpgradablePublicSaleDistributorV1__factory } from '../typechain/factories/UpgradablePublicSaleDistributorV1__factory'
import { UpgradableCommunityRewardDistributorV1 } from '../typechain/UpgradableCommunityRewardDistributorV1.d'
import { UpgradableDiversifyV1 } from '../typechain/UpgradableDiversifyV1'
import { UpgradablePublicSaleDistributorV1 } from '../typechain/UpgradablePublicSaleDistributorV1.d'

/**
 * Workflow:
 * 1. Deploy PublicSaleVault & CommunityVault
 */

async function deploy() {
  const TOTAL_SUPPLY = 1000000000
  const PR_SUPPLY_PERCENTAGE = 10
  const TA_SUPPLY_PERCENTAGE = 10
  const COMMUNITY_SUPPLY_PERCENTAGE = 17.5
  const SEED_SALE_ROUND_1_SUPPLY_PERCENTAGE = 0.25
  const SEED_SALE_ROUND_2_SUPPLY_PERCENTAGE = 2.25
  const PRIVATE_SALE_SUPPLY_PERCENTAGE = 10
  const PUBLIC_SALE_SUPPLY_PERCENTAGE = 50

  const COMPANY_WALLET = ''
  const PRIVATE_SALE_WALLET = ''
  const FOUNDATION_WALLET = ''
  const VAULT_START_DATE = 34334
  const [deployer] = await ethers.getSigners()

  console.log('Deploying contracts with the account:', deployer.address)
  console.log('Account balance:', (await deployer.getBalance()).toString())

  // Factories
  const timelockedIntervalReleasedTokenVaultFactory = (await ethers.getContractFactory(
    'TimelockedIntervalReleasedTokenVault'
  )) as TimelockedIntervalReleasedTokenVault__factory
  const timelockedTokenVaultFactory = (await ethers.getContractFactory(
    'TimelockedTokenVault'
  )) as TimelockedTokenVault__factory
  const communityRewardDistributorFactory = (await ethers.getContractFactory(
    'UpgradableCommunityRewardDistributorV1'
  )) as UpgradableCommunityRewardDistributorV1__factory
  const diversifyTokenV1Factory = (await ethers.getContractFactory(
    'UpgradableDiversifyV1'
  )) as UpgradableDiversifyV1__factory
  const publicSaleDistributor = (await ethers.getContractFactory(
    'UpgradablePublicSaleDistributorV1'
  )) as UpgradablePublicSaleDistributorV1__factory
  const seedSaleRoundFactory = (await ethers.getContractFactory('SeedSaleRound')) as SeedSaleRound__factory

  // Deploy: PR Vault (TimelockedIntervalReleasedTokenVault)
  // TODO: Set startdate, duration, interval
  const deployedPrTokenLockVault = await timelockedIntervalReleasedTokenVaultFactory.deploy(
    COMPANY_WALLET,
    VAULT_START_DATE,
    34234,
    180
  )

  // Deploy: T & A Vault (TimelockedIntervalReleasedTokenVault)
  // TODO: Set startdate, duration, interval
  const deployedTaTokenLockVault = await timelockedIntervalReleasedTokenVaultFactory.deploy(
    COMPANY_WALLET,
    VAULT_START_DATE,
    34234,
    90
  )

  // Deploy: CommunityRewardDistributor
  // Deploy: CommunityRewardVault (TimelockedIntervalReleasedTokenVault)
  const deployedCommunityRewardDistributorProxy = (await upgrades.deployProxy(
    communityRewardDistributorFactory
  )) as UpgradableCommunityRewardDistributorV1

  const deployedCommunityTokenLockVault = await timelockedIntervalReleasedTokenVaultFactory.deploy(
    deployedCommunityRewardDistributorProxy.address,
    VAULT_START_DATE,
    34234,
    360
  )

  // Deploy: SeedSale Round 1-2
  // TODO: -> Set: Params
  const deployedSeedSaleRound1 = await seedSaleRoundFactory.deploy(COMPANY_WALLET, 30, 30)
  const deployedSeedSaleRound2 = await seedSaleRoundFactory.deploy(COMPANY_WALLET, 30, 30)

  // Deploy: PrivateSale
  // TODO: set duration
  const deployedPrivateSaleTokenLockVault = await timelockedTokenVaultFactory.deploy(PRIVATE_SALE_WALLET, 2323, 2323)

  // Deploy: PublicSaleVault
  const deployedPublicSaleVaultProxy = (await upgrades.deployProxy(
    publicSaleDistributor
  )) as UpgradablePublicSaleDistributorV1
  const deployedPublicSaleTokenLockVault = await timelockedTokenVaultFactory.deploy(
    deployedPublicSaleVaultProxy.address,
    2323,
    2323
  )

  // Deploy: Token
  const totalSupplyPercentage = TOTAL_SUPPLY / 100
  const supplyMap = new Map([
    [deployedPrTokenLockVault.address, totalSupplyPercentage * PR_SUPPLY_PERCENTAGE],
    [deployedTaTokenLockVault.address, totalSupplyPercentage * TA_SUPPLY_PERCENTAGE],
    [deployedCommunityTokenLockVault.address, totalSupplyPercentage * COMMUNITY_SUPPLY_PERCENTAGE],
    [deployedPublicSaleTokenLockVault.address, totalSupplyPercentage * PUBLIC_SALE_SUPPLY_PERCENTAGE],
    [deployedPrivateSaleTokenLockVault.address, totalSupplyPercentage * PRIVATE_SALE_SUPPLY_PERCENTAGE],
    [deployedSeedSaleRound1.address, totalSupplyPercentage * SEED_SALE_ROUND_1_SUPPLY_PERCENTAGE],
    [deployedSeedSaleRound2.address, totalSupplyPercentage * SEED_SALE_ROUND_2_SUPPLY_PERCENTAGE],
  ])

  const deployedTokenProxy = (await upgrades.deployProxy(diversifyTokenV1Factory, [
    [...supplyMap.keys()],
    [...supplyMap.values()],
    FOUNDATION_WALLET,
  ])) as UpgradableDiversifyV1

  const DIV_TOKEN_ADDRESS = deployedTokenProxy.address
  console.log('Token address:', DIV_TOKEN_ADDRESS)

  // Start vaults
  await deployedPrTokenLockVault.start(DIV_TOKEN_ADDRESS)
  await deployedTaTokenLockVault.start(DIV_TOKEN_ADDRESS)
  await deployedCommunityTokenLockVault.start(DIV_TOKEN_ADDRESS)
  await deployedPrivateSaleTokenLockVault.start(DIV_TOKEN_ADDRESS)
  await deployedPublicSaleTokenLockVault.start(DIV_TOKEN_ADDRESS)

  /*
  TODO: Transfer Ownership
    // Transfer ownership to gnosisSafe
    const gnosisSafe = '0x3Bc4f238330CfB5D0767722Ad1f092c806AB7a2b'
    console.log('Transferring ownership of ProxyAdmin...')
    // The owner of the ProxyAdmin can upgrade our contracts
    await upgrades.admin.transferProxyAdminOwnership(gnosisSafe)
    console.log('Transferred ownership of ProxyAdmin to:', gnosisSafe)
    */
}

// execute main
deploy()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
