import { parseEther } from '@ethersproject/units'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { expect } from 'chai'
import { ethers, upgrades } from 'hardhat'
import moment from 'moment'
import { SeedSaleRound__factory } from '../typechain/factories/SeedSaleRound__factory'
import { UpgradableDiversifyV1__factory } from '../typechain/factories/UpgradableDiversifyV1__factory'
import { SeedSaleRound } from '../typechain/SeedSaleRound'
import { UpgradableDiversifyV1 } from '../typechain/UpgradableDiversifyV1'
import { daysToSeconds } from './utils/testHelpers'
describe('SeedSaleRound', function () {
  let divToken: UpgradableDiversifyV1
  let addr1: SignerWithAddress // owner Wallet
  let addr2: SignerWithAddress
  let addr3: SignerWithAddress
  let beneficary: SignerWithAddress
  let seedSaleRound: SeedSaleRound
  const SEED_SALE_DURATION = daysToSeconds(10)
  const SEED_SALE_LOCKING_PERIOD = daysToSeconds(360)
  const SEED_SALE_START_DATE = moment().add(1, 'd').unix()
  const SEED_SALE_RATE = 200
  const SEED_SALE_WEI_GOAL = parseEther('10')
  const SEED_SALE_TOTAL_SUPPLY = 100000 // divs
  this.beforeEach(async () => {
    const [a1, a2, a3, a4] = await ethers.getSigners()
    addr1 = a1
    addr2 = a2
    addr3 = a3
    beneficary = a4

    // Deploy seedsale round
    const seedSaleRoundFactory = (await ethers.getContractFactory('SeedSaleRound')) as SeedSaleRound__factory
    seedSaleRound = await seedSaleRoundFactory.deploy()

    // Deploy token
    const tokenFactory = (await ethers.getContractFactory('UpgradableDiversify_V1')) as UpgradableDiversifyV1__factory
    divToken = (await upgrades.deployProxy(tokenFactory, [
      [addr1.address, seedSaleRound.address],
      [1000000000, SEED_SALE_TOTAL_SUPPLY],
      addr3.address,
    ])) as UpgradableDiversifyV1
  })

  describe('Setup', function () {
    it('should revert when called from other than owner', async function () {
      await expect(
        seedSaleRound
          .connect(addr2.address)
          .setup(
            beneficary.address,
            SEED_SALE_DURATION,
            SEED_SALE_LOCKING_PERIOD,
            SEED_SALE_START_DATE,
            SEED_SALE_RATE,
            SEED_SALE_WEI_GOAL,
            divToken.address
          )
      ).to.be.reverted
    })

    it('should initialize correctly and raise event', async function () {
      await expect(
        seedSaleRound.setup(
          beneficary.address,
          SEED_SALE_START_DATE,
          SEED_SALE_DURATION,
          SEED_SALE_LOCKING_PERIOD,
          SEED_SALE_RATE,
          SEED_SALE_WEI_GOAL,
          divToken.address
        )
      )
        .to.emit(seedSaleRound, 'Setup')
        .withArgs(
          SEED_SALE_START_DATE,
          SEED_SALE_RATE,
          SEED_SALE_WEI_GOAL,
          parseEther(SEED_SALE_TOTAL_SUPPLY.toString()),
          SEED_SALE_DURATION,
          SEED_SALE_LOCKING_PERIOD
        )
    })
  })
})
