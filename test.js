const { ethers } = require('ethers');
const keccak256 = require('keccak256')

const erc20ABI = require('./abis/erc20.json')
const routerABI = require('./abis/router.json')
const swapABI = require('./abis/swap.json')

const avaxRPCJSON = 'https://api.avax.network/ext/bc/C/rpc'
const providerJSON = new ethers.providers.JsonRpcProvider(avaxRPCJSON);


async function getCostWAVAX(address) {

  const traderJoeContract = '0x60aE616a2155Ee3d9A68541Ba4544862310933d4'

  const contract = new ethers.Contract(traderJoeContract, swapABI, providerJSON);
  const oneAVAX = '1000000000000000000'
  const WAVAX = '0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7'
  const COQ = address

  const cost = await contract.getAmountsOut(oneAVAX, [WAVAX, COQ])
  var strCost = cost[1].toString()
  strCost = strCost.substring(0, strCost.length - 18)

  return strCost
}


const getGas = async() => {
  var res = await providerJSON.getGasPrice()
  return Math.round(ethers.utils.formatUnits(res, "gwei"))
}


const checkUnsellable = async(contractAddress) => {
  var res = await fetch('https://api.routescan.io/v2/network/mainnet/evm/43114/etherscan/api?module=contract&action=getsourcecode&address=' + contractAddress)
  res = await res.json()

  try {
    if(res.result[0].SourceCode.includes('kiuiixa')) {
      return 'Unsellable Hack ❌'
    } else {
      return 'Seems promising 🤞'
    }
  } catch(e) {
    return 'Unknown ❌'
  }
}


getVerification('0x0BB885e49dE1b55c73BCA037b4Ff05B6955dD789').then(data => {
  console.log(data)
})
// getVerification('0x819913aac5a9407a94806f14a0dbe4fbb3ee732e').then(data => {
//   console.log(data)
// })