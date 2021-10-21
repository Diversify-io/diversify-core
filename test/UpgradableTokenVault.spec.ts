import { BigNumber } from '@ethersproject/bignumber'
import { parseEther } from '@ethersproject/units'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { expect } from 'chai'
import { ethers, upgrades } from 'hardhat'
import { UpgradableDiversifyV1, UpgradableDiversifyV1__factory, UpgradableTokenVaultV2Mock } from '../types'
import { UpgradableTokenVault__factory } from '../types/factories/UpgradableTokenVault__factory'
import { UpgradableTokenVault } from '../types/UpgradableTokenVault.d'
import { calculateReceivedAmount } from './helpers/calculators'

describe('UpgradableTokenVault', function () {
  let divToken: UpgradableDiversifyV1
  let addr1: SignerWithAddress // owner Wallet
  let addr2: SignerWithAddress
  let addr3: SignerWithAddress // Foundation
  let addr4: SignerWithAddress // Community
  let upgradableTokenVaultImpl: UpgradableTokenVault
  const distributorInitalSupply = 50000
  const distributorAmountAfterTranfer = calculateReceivedAmount(BigNumber.from(distributorInitalSupply))
  this.beforeEach(async () => {
    const [a1, a2, a3, a4] = await ethers.getSigners()
    addr1 = a1
    addr2 = a2
    addr3 = a3
    addr4 = a4

    const tokenFactory = (await ethers.getContractFactory('UpgradableDiversify_V1')) as UpgradableDiversifyV1__factory
    divToken = (await upgrades.deployProxy(tokenFactory, [
      [addr1.address],
      [1000000000],
      addr3.address,
      addr4.address,
    ])) as UpgradableDiversifyV1

    const UpgradableTokenVault = (await ethers.getContractFactory(
      'UpgradableTokenVault'
    )) as UpgradableTokenVault__factory

    upgradableTokenVaultImpl = (await upgrades.deployProxy(UpgradableTokenVault)) as UpgradableTokenVault
    await upgradableTokenVaultImpl.setToken(divToken.address)
    await divToken.transfer(upgradableTokenVaultImpl.address, distributorInitalSupply)
  })

  it('should return the token', async function () {
    expect(await upgradableTokenVaultImpl.token()).to.be.equal(divToken.address)
  })

  it('retrieve tokens should be restricted to owner', async function () {
    await expect(upgradableTokenVaultImpl.connect(addr2.address).retrieveTokens(addr1.address, divToken.address)).to.be
      .reverted
  })

  it('should revert when retrieve token is called with setted token', async function () {
    await expect(upgradableTokenVaultImpl.retrieveTokens(addr1.address, divToken.address)).to.be.reverted
  })

  it('should retrieve alien tokens', async function () {
    // Arrange
    const alienFactory = (await ethers.getContractFactory('UpgradableDiversify_V1')) as UpgradableDiversifyV1__factory
    const initalAmount = 2000000000
    const transferredAmount = calculateReceivedAmount(BigNumber.from(initalAmount))

    const alienToken = (await upgrades.deployProxy(alienFactory, [
      [upgradableTokenVaultImpl.address, addr2.address],
      [initalAmount, initalAmount],
      addr3.address,
      addr4.address,
    ])) as UpgradableDiversifyV1

    // Act
    await upgradableTokenVaultImpl.retrieveTokens(addr1.address, alienToken.address)

    // Assert
    expect(await alienToken.balanceOf(upgradableTokenVaultImpl.address)).to.be.equals(0)
    expect(await alienToken.balanceOf(addr1.address)).to.be.equals(parseEther(transferredAmount.toString()))
  })

  it('should be upgradable', async function () {
    // Arrange
    const distV2Factory = await ethers.getContractFactory('UpgradableTokenVault_V2_Mock')

    // Act
    const distV2 = (await upgrades.upgradeProxy(
      upgradableTokenVaultImpl.address,
      distV2Factory
    )) as UpgradableTokenVaultV2Mock

    // Assert
    expect(distV2.address).to.be.equals(upgradableTokenVaultImpl.address)
    expect(await distV2.Amount()).to.be.equal(distributorAmountAfterTranfer)
  })
})
