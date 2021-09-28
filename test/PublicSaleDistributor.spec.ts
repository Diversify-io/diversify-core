import { BigNumber } from '@ethersproject/bignumber'
import { parseEther } from '@ethersproject/units'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { expect } from 'chai'
import { ethers, upgrades } from 'hardhat'
import { UpgradableDiversifyV1__factory } from '../types/factories/UpgradableDiversifyV1__factory'
import { UpgradablePublicSaleDistributorV1__factory } from '../types/factories/UpgradablePublicSaleDistributorV1__factory'
import { UpgradableDiversifyV1 } from '../types/UpgradableDiversifyV1'
import { UpgradablePublicSaleDistributorV1 } from '../types/UpgradablePublicSaleDistributorV1'
import { UpgradablePublicSaleDistributorV2Mock } from '../types/UpgradablePublicSaleDistributorV2Mock'
import { calculateReceivedAmount } from './helpers/calculators'

describe('PublicSaleDistributor', function () {
  let divToken: UpgradableDiversifyV1
  let addr1: SignerWithAddress // owner Wallet
  let addr2: SignerWithAddress
  let addr3: SignerWithAddress
  let publicSaleDistributor: UpgradablePublicSaleDistributorV1
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

    const publicSaleDistributorFactory = (await ethers.getContractFactory(
      'UpgradablePublicSaleDistributor_V1'
    )) as UpgradablePublicSaleDistributorV1__factory

    publicSaleDistributor = (await upgrades.deployProxy(publicSaleDistributorFactory, [
      divToken.address,
    ])) as UpgradablePublicSaleDistributorV1

    await divToken.transfer(publicSaleDistributor.address, distributorInitalSupply)
  })

  it('should be restricted to owner', async function () {
    await expect(publicSaleDistributor.connect(addr2.address).retrieveTokens(addr1.address, divToken.address)).to.be
      .reverted
  })

  it('should revert when retrieve token is called with div', async function () {
    await expect(publicSaleDistributor.retrieveTokens(addr1.address, divToken.address)).to.be.reverted
  })

  it('should retrieve alien tokens', async function () {
    // Arrange
    const alienFactory = (await ethers.getContractFactory('UpgradableDiversify_V1')) as UpgradableDiversifyV1__factory
    const initalAmount = 2000000000
    const transferredAmount = calculateReceivedAmount(BigNumber.from(initalAmount))

    const alienToken = (await upgrades.deployProxy(alienFactory, [
      [publicSaleDistributor.address, addr2.address],
      [initalAmount, initalAmount],
      addr3.address,
    ])) as UpgradableDiversifyV1

    // Act
    await publicSaleDistributor.retrieveTokens(addr1.address, alienToken.address)

    // Assert
    expect(await alienToken.balanceOf(publicSaleDistributor.address)).to.be.equals(0)
    expect(await alienToken.balanceOf(addr1.address)).to.be.equals(parseEther(transferredAmount.toString()))
  })

  it('should be upgradable', async function () {
    // Arrange
    const distV2Factory = await ethers.getContractFactory('UpgradablePublicSaleDistributor_V2_Mock')

    // Act
    const distV2 = (await upgrades.upgradeProxy(
      publicSaleDistributor.address,
      distV2Factory
    )) as UpgradablePublicSaleDistributorV2Mock

    // Assert
    expect(distV2.address).to.be.equals(publicSaleDistributor.address)
    expect(await distV2.Amount()).to.be.equal(distributorAmountAfterTranfer)
  })
})
