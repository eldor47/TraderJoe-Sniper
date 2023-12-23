const { ethers } = require('ethers');
const keccak256 = require('keccak256')

console.log(keccak256('0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7' + '0x420FcA0121DC28039145009570975747295f2329').toString('hex'))

const avaxRPCJSON = 'https://api.avax.network/ext/bc/C/rpc'
const providerJSON = new ethers.providers.JsonRpcProvider(avaxRPCJSON);

const getContractCreationTimestamp = async(contractAddress) => {
  var res = await fetch('https://api.routescan.io/v2/network/mainnet/evm/43114/etherscan/api?module=contract&action=getcontractcreation&contractaddresses=' + contractAddress)
  res = await res.json()

  if(res.status === '1') {
    // get tx
    const transaction = await providerJSON.getTransaction(res.result[0].txHash)
    const block = await providerJSON.getBlock(transaction.blockNumber)
    
    return block.timestamp
  }
  return -1
}

const getDexScreenerPair = async (contractAddress) => {
  try {
    var res = await fetch("https://api.dexscreener.com/latest/dex/search/?q=" + contractAddress)
    res = await res.json()
  
    return res.pairs.filter(a => a.dexId === 'traderjoe')[0].url
  } catch(e) {
    console.log(e)
    return ''
  }
}

getDexScreenerPair('0x420FcA0121DC28039145009570975747295f2329')
// getVerification('0x819913aac5a9407a94806f14a0dbe4fbb3ee732e').then(data => {
//   console.log(data)
// })