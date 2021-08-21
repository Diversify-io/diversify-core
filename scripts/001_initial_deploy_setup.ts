import { ethers, upgrades } from 'hardhat'
import { CommunityRewardDistributor } from '../typechain/CommunityRewardDistributor.d'
import { DiversifyV1 } from '../typechain/DiversifyV1'
import { CommunityRewardDistributor__factory } from '../typechain/factories/CommunityRewardDistributor__factory'
import { DiversifyTokenV1__factory } from '../typechain/factories/DiversifyTokenV1__factory'
import { PublicSaleDistributor__factory } from '../typechain/factories/PublicSaleDistributor__factory'
import { TimelockedIntervalReleasedTokenVault__factory } from '../typechain/factories/TimelockedIntervalReleasedTokenVault__factory'
import { TimelockedTokenVault__factory } from '../typechain/factories/TimelockedTokenVault__factory'
import { PublicSaleDistributor } from '../typechain/PublicSaleDistributor.d'

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
  const timelockedokenVaultFactory = (await ethers.getContractFactory(
    'TimelockedTokenVault'
  )) as TimelockedTokenVault__factory
  const timelockedIntervalReleasedTokenVaultFactory = (await ethers.getContractFactory(
    'TimelockedIntervalReleasedTokenVault'
  )) as TimelockedIntervalReleasedTokenVault__factory
  const timelockedTokenVaultFactory = (await ethers.getContractFactory(
    'TimelockedTokenVault'
  )) as TimelockedTokenVault__factory
  const communityRewardDistributorFactory = (await ethers.getContractFactory(
    'CommunityRewardDistributor'
  )) as CommunityRewardDistributor__factory
  const diversifyTokenV1Factory = (await ethers.getContractFactory('DiversifyToken')) as DiversifyTokenV1__factory
  const publicSaleDistributor = (await ethers.getContractFactory('PublicSaleVault')) as PublicSaleDistributor__factory

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
  )) as CommunityRewardDistributor

  const deployedCommunityTokenLockVault = await timelockedIntervalReleasedTokenVaultFactory.deploy(
    deployedCommunityRewardDistributorProxy.address,
    VAULT_START_DATE,
    34234,
    360
  )

  // Deploy: SeedSale Round 1-4

  // Deploy: PrivateSale
  // TODO: set duration
  const deployedPrivateSaleTokenLockVault = await timelockedTokenVaultFactory.deploy(PRIVATE_SALE_WALLET, 2323, 2323)

  // Deploy: PublicSaleVault
  const deployedPublicSaleVaultProxy = (await upgrades.deployProxy(publicSaleDistributor)) as PublicSaleDistributor
  const deployedPublicSaleTokenLockVault = await timelockedTokenVaultFactory.deploy(
    deployedPublicSaleVaultProxy.address,
    2323,
    2323
  )

  // Deploy: Token
  const deployedTokenProxy = (await upgrades.deployProxy(diversifyTokenV1Factory, [])) as DiversifyV1
  console.log('Token address:', deployedTokenProxy.address)

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
