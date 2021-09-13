import { ethers, network } from 'hardhat'

/*
 * This method increases the time with the given seconds
 */
export const increaseTimeAndMine = async (offsetInSeconds: number) => {
  await network.provider.send('evm_increaseTime', [offsetInSeconds])
  await network.provider.send('evm_mine')
}

export const daysToSeconds = (days: number) => days * 60 * 60 * 24

export const getCurrentBlockTime = async () => {
  const blockNum = await ethers.provider.getBlockNumber()
  const block = await ethers.provider.getBlock(blockNum)
  const timestamp = block.timestamp
  return timestamp
}
