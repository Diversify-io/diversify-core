import { BigNumber } from '@ethersproject/bignumber'
import { parseEther } from '@ethersproject/units'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { expect } from 'chai'
import { ethers, upgrades } from 'hardhat'
import { UpgradableCommunityRewardDistributorV1__factory } from '../types/factories/UpgradableCommunityRewardDistributorV1__factory'
import { UpgradableDiversifyV1__factory } from '../types/factories/UpgradableDiversifyV1__factory'
import { UpgradableCommunityRewardDistributorV1 } from '../types/UpgradableCommunityRewardDistributorV1'
import { UpgradableCommunityRewardDistributorV2Mock } from '../types/UpgradableCommunityRewardDistributorV2Mock'
import { UpgradableDiversifyV1 } from '../types/UpgradableDiversifyV1'
import { calculateReceivedAmount } from './helpers/calculators'

describe('CommunityRewardDistributor', function () {
  let divToken: UpgradableDiversifyV1
  let addr1: SignerWithAddress // owner Wallet
  let addr2: SignerWithAddress
  let addr3: SignerWithAddress
  let communityDistributor: UpgradableCommunityRewardDistributorV1
  const distributorInitalSupply = 50000
  const distributorAmountAfterTranfer = calculateReceivedAmount(BigNumber.from(distributorInitalSupply))
  this.beforeEach(async () => {
    const [a1, a2, a3] = await ethers.getSigners()
    addr1 = a1
    addr2 = a2
    addr3 = a3

    const tokenFactory = (await ethers.getContractFactory('UpgradableDiversify_V1')) as UpgradableDiversifyV1__factory
    divToken = (await upgrades.deployProxy(tokenFactory, [
      [addr1.address],
      [1000000000],
      addr3.address,
    ])) as UpgradableDiversifyV1

    const communityDistributorFactory = (await ethers.getContractFactory(
      'UpgradableCommunityRewardDistributor_V1'
    )) as UpgradableCommunityRewardDistributorV1__factory

    communityDistributor = (await upgrades.deployProxy(communityDistributorFactory, [
      divToken.address,
    ])) as UpgradableCommunityRewardDistributorV1

    await divToken.transfer(communityDistributor.address, distributorInitalSupply)
  })

  it('should be restricted to owner', async function () {
    await expect(communityDistributor.connect(addr2.address).retrieveTokens(addr1.address, divToken.address)).to.be
      .reverted
  })

  it('should revert when retrieve token is called with div', async function () {
    await expect(communityDistributor.retrieveTokens(addr1.address, divToken.address)).to.be.reverted
  })

  it('should retrieve alien tokens', async function () {
    // Arrange
    const alienFactory = (await ethers.getContractFactory('UpgradableDiversify_V1')) as UpgradableDiversifyV1__factory
    const initalAmount = 2000000000
    const transferredAmount = calculateReceivedAmount(BigNumber.from(initalAmount))

    const alienToken = (await upgrades.deployProxy(alienFactory, [
      [communityDistributor.address, addr2.address],
      [initalAmount, initalAmount],
      addr3.address,
    ])) as UpgradableDiversifyV1

    // Act
    await communityDistributor.retrieveTokens(addr1.address, alienToken.address)

    // Assert
    expect(await alienToken.balanceOf(communityDistributor.address)).to.be.equals(0)
    expect(await alienToken.balanceOf(addr1.address)).to.be.equals(parseEther(transferredAmount.toString()))
  })

  it('should be upgradable', async function () {
    // Arrange
    const distV2Factory = await ethers.getContractFactory('UpgradableCommunityRewardDistributor_V2_Mock')

    // Act
    const distV2 = (await upgrades.upgradeProxy(
      communityDistributor.address,
      distV2Factory
    )) as UpgradableCommunityRewardDistributorV2Mock

    // Assert
    expect(distV2.address).to.be.equals(communityDistributor.address)
    expect(await distV2.Amount()).to.be.equal(distributorAmountAfterTranfer)
  })
})
