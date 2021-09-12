import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { ethers, upgrades } from 'hardhat'
import { SeedSaleRound__factory } from '../typechain/factories/SeedSaleRound__factory'
import { UpgradableDiversifyV1__factory } from '../typechain/factories/UpgradableDiversifyV1__factory'
import { SeedSaleRound } from '../typechain/SeedSaleRound'
import { UpgradableDiversifyV1 } from '../typechain/UpgradableDiversifyV1'

describe('SeedSaleRound', function () {
  let divToken: UpgradableDiversifyV1
  let addr1: SignerWithAddress // owner Wallet
  let addr2: SignerWithAddress
  let addr3: SignerWithAddress
  let beneficary: SignerWithAddress
  let seedSaleRound: SeedSaleRound
  this.beforeEach(async () => {
    const [a1, a2, a3, a4] = await ethers.getSigners()
    addr1 = a1
    addr2 = a2
    addr3 = a3
    beneficary = a4
    const tokenFactory = (await ethers.getContractFactory('UpgradableDiversify_V1')) as UpgradableDiversifyV1__factory
    divToken = (await upgrades.deployProxy(tokenFactory, [
      [addr1.address],
      [1000000000],
      addr3.address,
    ])) as UpgradableDiversifyV1

    const seedSaleRoundFactory = (await ethers.getContractFactory('SeedSaleRound')) as SeedSaleRound__factory

    seedSaleRound = await seedSaleRoundFactory.deploy(beneficary.address)
    seedSaleRound = (await upgrades.deployProxy(seedSaleRoundFactory, [beneficary.address])) as SeedSaleRound
  })

  /*it('should be restricted to owner', async function () {
    await expect(SeedSaleRound.connect(addr2.address).retrieveTokens(addr1.address, divToken.address)).to.be.reverted
  })*/
})
