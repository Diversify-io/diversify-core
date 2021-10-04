import hre, { ethers, getNamedAccounts, upgrades } from 'hardhat'
import { SeedSaleRound__factory } from '../types/factories/SeedSaleRound__factory'
import { TimelockedIntervalReleasedTokenVault__factory } from '../types/factories/TimelockedIntervalReleasedTokenVault__factory'
import { TimelockedTokenVault__factory } from '../types/factories/TimelockedTokenVault__factory'
import { UpgradableCommunityRewardDistributorV1__factory } from '../types/factories/UpgradableCommunityRewardDistributorV1__factory'
import { UpgradableDiversifyV1__factory } from '../types/factories/UpgradableDiversifyV1__factory'
import { UpgradablePublicSaleDistributorV1__factory } from '../types/factories/UpgradablePublicSaleDistributorV1__factory'
import { UpgradableCommunityRewardDistributorV1 } from '../types/UpgradableCommunityRewardDistributorV1.d'
import { UpgradableDiversifyV1 } from '../types/UpgradableDiversifyV1'
import { UpgradablePublicSaleDistributorV1 } from '../types/UpgradablePublicSaleDistributorV1.d'
import { deployContract, getContractFactory, saveContractAddress } from '../utils/deploy'
/**
 * Workflow:
 * 1. Deploy PublicSaleVault & CommunityVault
 */

async function deploy() {
  // Make Sure
  await hre.run('clean')
  await hre.run('compile')

  // Constants
  const { deployer, company, privateSeedSale, foundation, dev } = await getNamedAccounts()
  const deployerWithSigner = await ethers.getSigner(deployer)
  const NETWORK_NAME = hre.network.name

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
    await getContractFactory<UpgradableCommunityRewardDistributorV1__factory>('UpgradableCommunityRewardDistributorV1')
  const UpgradableDiversifyV1 = await getContractFactory<UpgradableDiversifyV1__factory>('UpgradableDiversifyV1')
  const UpgradablePublicSaleDistributorV1 = await getContractFactory<UpgradablePublicSaleDistributorV1__factory>(
    'UpgradablePublicSaleDistributorV1'
  )
  const SeedSaleRound = await getContractFactory<SeedSaleRound__factory>('SeedSaleRound')

  // Start Deployment
  console.log('Deploying contracts with the account:', deployer)
  console.log('Account balance:', (await deployerWithSigner.getBalance()).toString())

  // Deploy: PR Vault (TimelockedIntervalReleasedTokenVault)
  const prVault = await deployContract(
    TimelockedIntervalReleasedTokenVault,
    company,
    PR_VAULT_DURATION,
    PR_VAULT_INTERVAL
  )

  // Deploy: T & A Vault (TimelockedIntervalReleasedTokenVault)
  const taVault = await deployContract(
    TimelockedIntervalReleasedTokenVault,
    company,
    TA_VAULT_DURATION,
    TA_VAULT_INTERVAL
  )

  // Deploy: CommunityRewardDistributor
  const communityDistributorProxy = (await upgrades.deployProxy(
    UpgradableCommunityRewardDistributorV1
  )) as UpgradableCommunityRewardDistributorV1
  await communityDistributorProxy.deployed()
  saveContractAddress(NETWORK_NAME, 'communityDistributorProxy', communityDistributorProxy.address)

  // Deploy: CommunityRewardVault (TimelockedIntervalReleasedTokenVault)
  const communityVault = await deployContract(
    TimelockedIntervalReleasedTokenVault,
    communityDistributorProxy.address,
    COMMUNITY_VAULT_DURATION,
    COMMUNITY_VAULT_INTERVAL
  )

  // Deploy: SeedSale Round 1
  const seedSaleRound1 = await deployContract(SeedSaleRound)

  // Deploy: SeedSale Round 2
  const seedSaleRound2 = await deployContract(SeedSaleRound)

  // Deploy: PrivateSale
  const privateSaleVault = await deployContract(TimelockedTokenVault, privateSeedSale, PRIVATE_SEED_SALE_VAULT_DURATION)

  // Deploy: publicSaleProxy
  const publicSaleProxy = (await upgrades.deployProxy(
    UpgradablePublicSaleDistributorV1
  )) as UpgradablePublicSaleDistributorV1
  await publicSaleProxy.deployed()
  saveContractAddress(NETWORK_NAME, 'publicSaleProxy', publicSaleProxy.address)

  // Deploy: publicSaleVault
  const publicSaleVault = await TimelockedTokenVault.deploy(publicSaleProxy.address, PUBLIC_SEED_SALE_VAULT_DURATION)
  await publicSaleVault.deployed()
  saveContractAddress(NETWORK_NAME, 'publicSaleVault', publicSaleVault.address)

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

  const deployedTokenProxy = (await upgrades.deployProxy(UpgradableDiversifyV1, [
    [...supplyMap.keys()],
    [...supplyMap.values()],
    foundation,
  ])) as UpgradableDiversifyV1
  await deployedTokenProxy.deployed()
  saveContractAddress(NETWORK_NAME, 'deployedTokenProxy', deployedTokenProxy.address)

  // Start Vaults
  const { address: DIV_TOKEN_ADDRESS } = deployedTokenProxy
  await prVault.start(DIV_TOKEN_ADDRESS)
  await taVault.start(DIV_TOKEN_ADDRESS)
  await communityVault.start(DIV_TOKEN_ADDRESS)
  await privateSaleVault.start(DIV_TOKEN_ADDRESS)
  await publicSaleVault.start(DIV_TOKEN_ADDRESS)

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
