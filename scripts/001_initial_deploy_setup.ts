import hre, { getNamedAccounts, upgrades } from 'hardhat'
import { SeedSaleRound__factory } from '../types/factories/SeedSaleRound__factory'
import { TimelockedIntervalReleasedTokenVault__factory } from '../types/factories/TimelockedIntervalReleasedTokenVault__factory'
import { TimelockedTokenVault__factory } from '../types/factories/TimelockedTokenVault__factory'
import { UpgradableCommunityRewardDistributorV1__factory } from '../types/factories/UpgradableCommunityRewardDistributorV1__factory'
import { UpgradableDiversifyV1__factory } from '../types/factories/UpgradableDiversifyV1__factory'
import { UpgradablePublicSaleDistributorV1__factory } from '../types/factories/UpgradablePublicSaleDistributorV1__factory'
import { UpgradableCommunityRewardDistributorV1 } from '../types/UpgradableCommunityRewardDistributorV1.d'
import { UpgradableDiversifyV1 } from '../types/UpgradableDiversifyV1'
import { UpgradablePublicSaleDistributorV1 } from '../types/UpgradablePublicSaleDistributorV1.d'
import { getContractFactory, saveContractAddress } from '../utils/deploy'
/**
 * Workflow:
 * 1. Deploy PublicSaleVault & CommunityVault
 */

async function deploy() {
  // Make Sure
  await hre.run('clean')
  await hre.run('compile')

  // Constants
  const { deployer } = await getNamedAccounts()
  const NETWORK_NAME = hre.network.name
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

  console.log('Deploying contracts with the account:', deployer.address)
  console.log('Account balance:', (await deployer.getBalance()).toString())

  // Factories
  const TimelockedIntervalReleasedTokenVault = await getContractFactory<TimelockedIntervalReleasedTokenVault__factory>(
    'TimelockedIntervalReleasedTokenVault'
  )
  const TimelockedTokenVault = await getContractFactory<TimelockedTokenVault__factory>('TimelockedTokenVault')
  const UpgradableCommunityRewardDistributorV1 =
    await getContractFactory<UpgradableCommunityRewardDistributorV1__factory>('UpgradableCommunityRewardDistributorV1')
  const UpgradableDiversifyV1 = await getContractFactory<UpgradableDiversifyV1__factory>('UpgradableDiversifyV1')
  const UpgradablePublicSaleDistributorV1 = await getContractFactory<UpgradablePublicSaleDistributorV1__factory>(
    'UpgradablePublicSaleDistributorV1'
  )

  const SeedSaleRound = await getContractFactory<SeedSaleRound__factory>('SeedSaleRound')
  // Deploy: PR Vault (TimelockedIntervalReleasedTokenVault)
  // TODO: Set startdate, duration, interval
  const deployedPrTokenLockVault = await TimelockedIntervalReleasedTokenVault.deploy(
    COMPANY_WALLET,
    VAULT_START_DATE,
    34234,
    180
  )
  await deployedPrTokenLockVault.deployed()
  saveContractAddress(NETWORK_NAME, 'SeedSaleRound', deployedPrTokenLockVault.address)

  // Deploy: T & A Vault (TimelockedIntervalReleasedTokenVault)
  // TODO: Set startdate, duration, interval
  const deployedTaTokenLockVault = await TimelockedIntervalReleasedTokenVault.deploy(
    COMPANY_WALLET,
    VAULT_START_DATE,
    34234,
    90
  )

  // Deploy: CommunityRewardDistributor
  // Deploy: CommunityRewardVault (TimelockedIntervalReleasedTokenVault)
  const deployedCommunityRewardDistributorProxy = (await upgrades.deployProxy(
    UpgradableCommunityRewardDistributorV1
  )) as UpgradableCommunityRewardDistributorV1

  const deployedCommunityTokenLockVault = await TimelockedIntervalReleasedTokenVault.deploy(
    deployedCommunityRewardDistributorProxy.address,
    VAULT_START_DATE,
    34234,
    360
  )

  // Deploy: SeedSale Round 1-2
  // TODO: -> Set: Params
  const deployedSeedSaleRound1 = await SeedSaleRound.deploy(COMPANY_WALLET, 30, 30)
  const deployedSeedSaleRound2 = await SeedSaleRound.deploy(COMPANY_WALLET, 30, 30)

  // Deploy: PrivateSale
  // TODO: set duration
  const deployedPrivateSaleTokenLockVault = await TimelockedTokenVault.deploy(PRIVATE_SALE_WALLET, 2323, 2323)

  // Deploy: PublicSaleVault
  const deployedPublicSaleVaultProxy = (await upgrades.deployProxy(
    UpgradablePublicSaleDistributorV1
  )) as UpgradablePublicSaleDistributorV1
  const deployedPublicSaleTokenLockVault = await TimelockedTokenVault.deploy(
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

  const deployedTokenProxy = (await upgrades.deployProxy(UpgradableDiversifyV1, [
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

  /*

  console.log(`Contract deployed by: ${accountAddress}`)
  console.log('Collection imp:', collectonImp.address)
  console.log('Rarities:', rarities.address)
  console.log('Committee:', committee.address)
  console.log('Collection Manager :', collectionManager.address)
  console.log('Forwarder:', forwarder.address)
  console.log('Collection Factory:', collectionFactoryV2.address)
  console.log('Collection Store:', collectionStore.address)
  console.log('NFT Marketplace:', marketplace.address)
  */
}

// execute main
deploy()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
