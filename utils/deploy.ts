import { ContractFactory } from 'ethers'
import fs from 'fs'
import { ethers } from 'hardhat'
import path from 'path'

type ContractAdresses = {
  [network: string]: {
    [contract: string]: string
  }
}

function getSavedContractAddresses(): ContractAdresses {
  let json
  try {
    json = fs.readFileSync(path.join(__dirname, '../contract-addresses.json'), 'utf-8')
  } catch (err) {
    json = '{}'
  }
  const addrs: ContractAdresses = JSON.parse(json)
  return addrs
}

function saveContractAddress(network: string, contract: string, address: string) {
  const addrs = getSavedContractAddresses()
  addrs[network] = addrs[network] || {}
  addrs[network][contract] = address
  fs.writeFileSync(path.join(__dirname, '../contract-addresses.json'), JSON.stringify(addrs, null, '    '))
}

const getContractFactory = async <T extends ContractFactory>(contractName: string) =>
  (await ethers.getContractFactory(contractName)) as T

export { getSavedContractAddresses, saveContractAddress, getContractFactory }
