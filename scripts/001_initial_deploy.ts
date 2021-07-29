import { ethers, upgrades } from 'hardhat'
import { DiversifyToken } from '../typechain/DiversifyToken'

// npx hardhat run scripts/deploy.js --network
async function main() {
  const [deployer] = await ethers.getSigners()
  const foundationWallet = ''

  console.log('Deploying contracts with the account:', deployer.address)
  console.log('Account balance:', (await deployer.getBalance()).toString())

  const Token = await ethers.getContractFactory('DiversifyToken')
  const mc = (await upgrades.deployProxy(Token, [foundationWallet])) as DiversifyToken
  console.log('Token address:', mc.address)

  // Transfer ownership to gnosisSafe
  const gnosisSafe = '0x3Bc4f238330CfB5D0767722Ad1f092c806AB7a2b'
  console.log('Transferring ownership of ProxyAdmin...')
  // The owner of the ProxyAdmin can upgrade our contracts
  await upgrades.admin.transferProxyAdminOwnership(gnosisSafe)
  console.log('Transferred ownership of ProxyAdmin to:', gnosisSafe)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
