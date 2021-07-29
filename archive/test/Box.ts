import { expect } from 'chai'
import { ethers } from 'hardhat'

describe('Box contract', function () {
  it('Store and retrieve should work', async function () {
    const [owner] = await ethers.getSigners()

    const Box = await ethers.getContractFactory('Box')

    const boxContract = await Box.deploy()
    // store contract
    await boxContract.store(42)
    expect(await boxContract.retrieve()).to.equal(42)
  })

  it('Store should only be accessible by creator', async function () {
    const [owner, addr1] = await ethers.getSigners()

    const Box = await ethers.getContractFactory('Box')

    const boxContract = await Box.deploy()
    // store contract

    await expect(boxContract.connect(addr1).store(42)).to.reverted
  })
})
