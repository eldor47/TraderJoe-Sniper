const { ethers } = require('ethers');
const { EmbedBuilder } = require('discord.js');
const contractABI = require('./abis/router.json')
const erc20ABI = require('./abis/erc20.json')
const swapABI = require('./abis/swap.json')
require('dotenv').config()


// Replace with your WebSocket provider URL
const provider = new ethers.providers.WebSocketProvider(process.env.WSS_URL);
const avaxRPCJSON = process.env.RPC_URL
const providerJSON = new ethers.providers.JsonRpcProvider(avaxRPCJSON);
// Trader Joes CA
const contractAddress = '0x60aE616a2155Ee3d9A68541Ba4544862310933d4';

// Create a contract instance
//const contract = new ethers.Contract(contractAddress, contractABI, provider);

const getListener = async (client) => {

  const channelId = '1187949957009903716';
  const channel = client.channels.cache.get(channelId);
  //channel.send('STARTING AVAX WSS RPC CONNECTION')

  return provider.on("block", async (blockNumber) => {

    try {
      const block = await providerJSON.getBlock(blockNumber);
      if (block && block.transactions.length > 0) {
        for (const txHash of block.transactions) {
          const transaction = await providerJSON.getTransaction(txHash);
          if (transaction && transaction.to === contractAddress) {
            const receipt = await providerJSON.getTransactionReceipt(txHash);
            if (transaction.data.includes('0xf91b3f72')) {

              console.log('Add liquidity', transaction.hash)
              const targetAddress = '0x' + transaction.data.slice(34, 74)
              console.log('Contract', targetAddress)

              const erc20contract = new ethers.Contract(targetAddress, erc20ABI, providerJSON);
              const name = await erc20contract.name();
              const symbol = await erc20contract.symbol();
              console.log('Token Name: ', name)
              console.log('Token Symbol: ', symbol)
              // Send a message to the specified channel
              const isVerified = await getVerification(targetAddress)
              const creationTimestamp = await getContractCreationTimestamp(targetAddress)
              const dexScreenerURL = await getDexScreenerPair(targetAddress)
              const owner = await getOwner(targetAddress)
              const cost = await getCostWAVAX(targetAddress)
              const unsellable = await checkUnsellable(targetAddress)
              
              const isNew = !OneHourAgo(new Date(creationTimestamp))
              console.log(creationTimestamp)
              console.log(Date.now())
              var content = {
                txHash: transaction.hash,
                contractAddress: '0x' + transaction.data.slice(34, 74),
                tokenName: name,
                tokenSymbol: symbol,
                isVerified: isVerified,
                creationTimestamp: creationTimestamp,
                dexScreenerURL: dexScreenerURL,
                isNew: isNew,
                owner: owner,
                cost: cost,
                unsellable: unsellable
              }
              console.log(content)

              if(OneHourAgo(creationTimestamp)) {
                createEmbed(channel, content)
              }
            }
          }
        }
      }
    } catch (error) {
      //console.error(error);
    }
  });
}

const getVerification = async(contractAddress) => {
  var res = await fetch('https://api.routescan.io/v2/network/mainnet/evm/43114/etherscan/api?module=contract&action=getsourcecode&address=' + contractAddress)
  res = await res.json()
  return res.message === "OK"
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

async function getOwner(address) {
  try {
    const contract = new ethers.Contract(address, erc20ABI, providerJSON);
    const owner = await contract.functions.owner()
    return owner[0]
  } catch(e) {
    console.log(e)
    return 'No ownership functions'
  }
}

const OneHourAgo = (date) => {

  str = Date.now().toString();
  console.log("Original data: ",str);
  str = str.slice(0, -3);
  str = parseInt(str);

  return (str - date) / 3600 < 1.5;
}

async function getCostWAVAX(address) {
  try {
    // Swap contract
    const traderJoeContract = '0x60aE616a2155Ee3d9A68541Ba4544862310933d4'

    const contract = new ethers.Contract(traderJoeContract, swapABI, providerJSON);
    const oneAVAX = '1000000000000000000'
    const WAVAX = '0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7'
    const COQ = address

    const cost = await contract.getAmountsOut(oneAVAX, [WAVAX, COQ])
    var strCost = cost[1].toString()
    strCost = strCost.substring(0, strCost.length - 18)

    return strCost
  } catch(e) {
    console.log(e)
    return 'Cost Error'
  }

}


const createEmbed = (channel, content) => {
  // inside a command, event listener, etc.
  const exampleEmbed = new EmbedBuilder()
    .setColor(0x800080)
    .setTitle(content.contractAddress)
    .setURL('https://snowtrace.dev/address/' + content.contractAddress)
    .setAuthor({ name: 'Liquidity Transaction', iconURL: 'https://cdn.routescan.io/_next/image?url=https%3A%2F%2Fcms-cdn.avascan.com%2Fcms2%2Favax-icon.de4ce0ba59ea.png&w=32&q=75', url: 'https://snowtrace.dev/tx/' + content.txHash })
    .setDescription(`Token - ${content.tokenName} - Symbol - $${content.tokenSymbol}`)
    .addFields(
      { name: 'Contract Verification', value: content.isVerified ? 'Verified ✅' : 'Not Verified ❌', inline: true },
      { name: 'Owner', value: content.owner === '0x0000000000000000000000000000000000000000' ? 'Renounced ✅' : content.owner + ' ❌', inline: true },
      { name: 'Sketchy Level', value: content.unsellable, inline: true },
    )
    .addFields(
      { name: `Charts`, value: `[Dexscreener Chart 📉](${content.dexScreenerURL})`},
      { name: `1 WAVAX buy 🛒`, value: content.cost + ` ${content.tokenSymbol}`, inline: true},
      { name: 'Method', value: 'Liquidity Added', inline: true },
    )
    .addFields(
      { name: 'Contract Creation Date 📅', value: `<t:${content.creationTimestamp}>` },
      { name: 'Contract Address', value: content.contractAddress, inline: true },
    )
    .setTimestamp()
    .setFooter({ text: '**Ape with risk 🙈', iconURL: 'https://cdn.routescan.io/_next/image?url=https%3A%2F%2Fcms-cdn.avascan.com%2Fcms2%2Favax-icon.de4ce0ba59ea.png&w=32&q=25' });

  channel.send({ embeds: [exampleEmbed] });
}


module.exports = { getListener }