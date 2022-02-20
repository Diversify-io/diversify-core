import { getImplementationAddress } from '@openzeppelin/upgrades-core'
import chalk from 'chalk'
import { Contract, ContractFactory, Overrides, utils } from 'ethers'
import fs from 'fs'
import hre, { config, ethers, upgrades } from 'hardhat'
import path from 'path'
import { Ownable } from '../types/Ownable.d'
type ThenArg<T> = T extends PromiseLike<infer U> ? U : T
type InitalizeArgs<T extends ContractFactory> = Parameters<ThenArg<ReturnType<T['deploy']>>['initialize']>

type ContractType = 'contract' | 'proxy'
type ContractBaseInformation = {
  type: ContractType
  name: string
  address: string
  verified: boolean
  meta: {
    src: string
    txHash: string
    owner: string
    args: any[]
  }
}

type ContractInformation =
  | ({ type: 'contract' } & ContractBaseInformation)
  | ({
      type: 'proxy'
      implementation: {
        src: string
        address: string
      }
    } & ContractBaseInformation)

type DeploymentLog = {
  [network: string]: {
    [contract: string]: ContractInformation
  }
}

const getDeploymentLogPath = () =>
  `../contracts${['hardhat', 'localhost'].includes(hre.network.name) ? '.dev' : ''}.json`

/**
 * Get the stored deployment log
 * @returns
 */
function getDeploymentLog(): DeploymentLog {
  let json
  try {
    json = fs.readFileSync(path.join(__dirname, getDeploymentLogPath()), 'utf-8')
  } catch (err) {
    json = '{}'
  }
  return JSON.parse(json)
}

/**
 *
 * @param network
 * @param contractName
 * @returns
 */
function getContractInformation(network: string, contractName: string): ContractInformation {
  const log = getDeploymentLog()
  return log[network][contractName] ?? {}
}

/**
 *
 * @param network
 * @param contractData
 */
function saveContractInformation(network: string, contractData: ContractInformation) {
  const addrs = getDeploymentLog()
  addrs[network] = addrs[network] || {}
  addrs[network][contractData.name] = contractData
  fs.writeFileSync(path.join(__dirname, getDeploymentLogPath()), JSON.stringify(addrs, null, '    '))
}

/**
 * getContractFactory
 * @param contractName
 * @returns
 */
const getContractFactory = async <T extends ContractFactory>(contractName: string) =>
  (await ethers.getContractFactory(contractName)) as T

/**
 * TypeSafe contract deployment
 * @param name
 * @param contractName
 * @param args
 * @returns
 */
const deployContract = async <T extends ContractFactory>(
  name: string,
  contractName: string,
  ...args: Parameters<T['deploy']>
): Promise<ReturnType<T['deploy']>> => {
  console.log(` 🛰  Deploying: ${name}`)
  const factory = (await getContractFactory(contractName)) as T
  const deployment = await factory.deploy(...args)
  await postDeploy(name, deployment)
  const artifact = await hre.artifacts.readArtifact(contractName)

  // Save contract informations
  const { address } = deployment
  saveContractInformation(hre.network.name, {
    type: 'contract',
    name,
    address,
    verified: false,
    meta: {
      src: `${artifact.sourceName}:${artifact.contractName}`,
      owner: deployment.deployTransaction.from,
      txHash: deployment.deployTransaction.hash,
      args,
    },
  })
  return deployment
}

/**
 * TypeSafe Proxy Deployment  with logging
 * @param name
 * @param contract
 * @param args
 * @returns
 */
const deployProxy = async <T extends ContractFactory>(
  name: string,
  contractName: string,
  ...args: InitalizeArgs<T> extends { overrides?: Overrides & { from?: string | Promise<string> } }
    ? [undefined?]
    : InitalizeArgs<T>
): Promise<ReturnType<T['deploy']>> => {
  console.log(` 🛰  Deploying proxy: ${name}`)
  const factory = (await getContractFactory(contractName)) as T
  const deployment = await upgrades.deployProxy(factory, args)
  await postDeploy(name, deployment)

  // Save contract informations
  const { address } = deployment
  const artifact = await hre.artifacts.readArtifact(contractName)
  saveContractInformation(hre.network.name, {
    type: 'proxy',
    name,
    address,
    verified: false,
    implementation: {
      address: (await deployment.deployed()) && (await getImplementationAddress(hre.ethers.provider, address)),
      src: `${artifact.sourceName}:${artifact.contractName}`,
    },
    meta: {
      src: '@openzeppelin/contracts/proxy/transparent/TransparentUpgradeableProxy.sol:TransparentUpgradeableProxy',
      owner: deployment.deployTransaction.from,
      txHash: deployment.deployTransaction.hash,
      args,
    },
  })
  return deployment
}

/**
 * Type safe ownership transfer with logging
 * @param name
 * @param contract
 * @param newOwner
 */
const transferOwnership = async <T extends Ownable>(name: string, contract: T, newOwner: string) => {
  console.log(` 👮 Transfering ownership: ${name}`)
  await contract.transferOwnership(newOwner)

  // Update contract information
  const network = hre.network.name
  let contractInformation = getContractInformation(network, name)
  saveContractInformation(network, {
    ...contractInformation,
    meta: {
      ...contractInformation.meta,
      owner: newOwner,
    },
  })
  console.log(' 🔐', chalk.cyan(name), 'ownership transferred to:', chalk.magenta(newOwner))
}

/**
 * Post deployment actions
 * @param name ContractName
 * @param deployment Contract deployment instance
 * @param args The contracts constructor passed arguments
 */
const postDeploy = async (name: string, deployment: Contract) => {
  let extraGasInfo = ''
  if (deployment && deployment.deployTransaction) {
    const gasUsed = deployment.deployTransaction.gasLimit.mul(deployment.deployTransaction.gasPrice ?? 0)
    extraGasInfo = `${utils.formatEther(gasUsed)} ETH, tx hash ${deployment.deployTransaction.hash}`

    console.log(' 📄', chalk.cyan(name), 'deployed to:', chalk.magenta(deployment.address))
    console.log(' ⛽', chalk.grey(extraGasInfo))
  }
}

/**
 * Verify task for etherscan
 * @param contractName
 * @param contractAddress
 * @param args
 * @param contract "contracts/Example.sol:ExampleContract"
 */
const etherscanVerify = async (contractName: string, contractAddress: string, args: any[], contract?: string) => {
  let tenderlyNetworks = ['kovan', 'goerli', 'mainnet', 'rinkeby', 'ropsten', 'polygon', 'polygonMumbai']
  let targetNetwork = process.env.HARDHAT_NETWORK || config.defaultNetwork

  if (tenderlyNetworks.includes(targetNetwork)) {
    console.log(chalk.blue(` 📁 Attempting etherscan verification of ${contractName} on ${targetNetwork}`))
    await hre.run('verify:verify', {
      address: contractAddress,
      constructorArguments: args,
      ...(contract && { contract }),
    })
  } else {
    console.log(chalk.grey(` 🧐 Contract verification not supported on ${targetNetwork}`))
  }
}

export {
  getDeploymentLog as getSavedContractAddresses,
  saveContractInformation as saveContractAddress,
  getContractFactory,
  deployContract,
  deployProxy,
  transferOwnership,
  etherscanVerify,
}
