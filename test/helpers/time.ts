import { ethers, network } from 'hardhat'
import moment, { MomentInput } from 'moment'
/*
 * This method increases the time with the given seconds
 */
export const increaseTimeAndMine = async (offsetInSeconds: number) => {
  await network.provider.send('evm_increaseTime', [offsetInSeconds])
  await network.provider.send('evm_mine')
}

export const daysToSeconds = (days: number) => days * 60 * 60 * 24

export const getSecondsBetweenDates = (dateA: MomentInput, dateB: MomentInput) =>
  Math.round(Math.abs(moment.duration(moment(dateA).diff(dateB)).asSeconds()))

export const getCurrentBlockTime = async () => {
  const blockNum = await ethers.provider.getBlockNumber()
  const block = await ethers.provider.getBlock(blockNum)
  const timestamp = block.timestamp
  return timestamp
}
