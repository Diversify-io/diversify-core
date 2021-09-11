import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { UpgradableDiversifyV1 } from '../typechain/UpgradableDiversifyV1'
import { UpgradableCommunityRewardDistributorV1 } from './../typechain/UpgradableCommunityRewardDistributorV1.d'

describe('CommunityRewardDistributor', function () {
  let divToken: UpgradableDiversifyV1
  let addr1: SignerWithAddress // owner Wallet
  let addr2: SignerWithAddress
  let addr3: SignerWithAddress
  let communityDistributor: UpgradableCommunityRewardDistributorV1
/*
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
  })

  it('should be restricted to owner', async function () {
    await expect(communityDistributor.connect(addr2.address).retrieveTokens(addr1.address, divToken.address)).to.be
      .reverted
  })
})
*/