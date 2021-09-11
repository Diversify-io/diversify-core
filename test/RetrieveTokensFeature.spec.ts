import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { expect } from 'chai'
import { ethers, upgrades } from 'hardhat'
import { RetrieveTokensFeature__factory } from '../typechain/factories/RetrieveTokensFeature__factory'
import { UpgradableDiversifyV1__factory } from '../typechain/factories/UpgradableDiversifyV1__factory'
import { RetrieveTokensFeature } from '../typechain/RetrieveTokensFeature.d'
import { UpgradableDiversifyV1 } from '../typechain/UpgradableDiversifyV1.d'

describe('RetrieveTokensFeature', function () {
  let divToken: UpgradableDiversifyV1
  let addr1: SignerWithAddress // owner Wallet
  let addr2: SignerWithAddress
  let addr3: SignerWithAddress
  let retrieveTokenFeature: RetrieveTokensFeature

  this.beforeEach(async () => {
    const [a1, a2, a3] = await ethers.getSigners()
    addr1 = a1
    addr2 = a2
    addr3 = a3
    const tokenFactory = (await ethers.getContractFactory('UpgradableDiversify_V1')) as UpgradableDiversifyV1__factory
    const retrieveTokensFeatureFactory = (await ethers.getContractFactory(
      'RetrieveTokensFeature'
    )) as RetrieveTokensFeature__factory

    retrieveTokenFeature = await retrieveTokensFeatureFactory.deploy()

    divToken = (await upgrades.deployProxy(tokenFactory, [
      [addr1.address, retrieveTokenFeature.address],
      [1000000000, 2000000000],
      addr3.address,
    ])) as UpgradableDiversifyV1
  })

  it('should retrieve div token and transfer correctly', async function () {
    // Arrange
    const rtfBalanceBefore = await divToken.balanceOf(retrieveTokenFeature.address)
    const ownerBalanceBefore = await divToken.balanceOf(addr1.address)

    // We need to keep in mind the burn function
    const amountToReceive = rtfBalanceBefore.mul(98.75 * 10 ** 2).div(10 ** 4)

    // Act
    await retrieveTokenFeature.retrieveTokens(addr1.address, divToken.address)
    const rtfBalanceAfter = await divToken.balanceOf(retrieveTokenFeature.address)
    const ownerBalanceAfter = await divToken.balanceOf(addr1.address)

    // Assert
    expect(rtfBalanceAfter).equals(0)
    expect(ownerBalanceAfter).equals(ownerBalanceBefore.add(amountToReceive))
  })
})
