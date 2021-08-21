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
  const COMPANY_WALLET = ''
  const PRIVATE_SALE_WALLET = ''
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

  // Deploy: SeedSale Round 1-4
  // TODO: -> Set: Params
  const deployedSeedSaleRound1 = await seedSaleRoundFactory.deploy(COMPANY_WALLET, 30, 30)
  const deployedSeedSaleRound2 = await seedSaleRoundFactory.deploy(COMPANY_WALLET, 30, 30)
  const deployedSeedSaleRound3 = await seedSaleRoundFactory.deploy(COMPANY_WALLET, 30, 30)
  const deployedSeedSaleRound4 = await seedSaleRoundFactory.deploy(COMPANY_WALLET, 30, 30)

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
  const deployedTokenProxy = (await upgrades.deployProxy(diversifyTokenV1Factory, [])) as UpgradableDiversifyV1
  console.log('Token address:', deployedTokenProxy.address)

  /*
  TODO: Arrange initial amount
  TODO: Start Vault, and other stuff
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
