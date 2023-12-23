const { ethers } = require('ethers');
const { EmbedBuilder } = require('discord.js');
const contractABI = require('./abis/router.json')
const erc20ABI = require('./abis/erc20.json')
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
  channel.send('STARTING AVAX WSS RPC CONNECTION')

  return provider.on("block", async (blockNumber) => {

    try {
      const block = await providerJSON.getBlock(blockNumber);
      if (block && block.transactions.length > 0) {
        for (const txHash of block.transactions) {
          const transaction = await providerJSON.getTransaction(txHash);
          if (transaction && transaction.to === contractAddress) {
            //const receipt = await providerJSON.getTransactionReceipt(txHash);
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
              var content = {
                txHash: transaction.hash,
                contractAddress: '0x' + transaction.data.slice(34, 74),
                tokenName: name,
                tokenSymbol: symbol,
                isVerified: isVerified,
                creationTimestamp: creationTimestamp,
                dexScreenerURL: dexScreenerURL
              }
              createEmbed(channel, content)
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

const createEmbed = (channel, content) => {
  // inside a command, event listener, etc.
  const exampleEmbed = new EmbedBuilder()
    .setColor(0x800080)
    .setTitle(content.contractAddress)
    .setURL('https://snowtrace.dev/address/' + content.contractAddress)
    .setAuthor({ name: 'Liquidity Transaction', iconURL: 'https://cdn.routescan.io/_next/image?url=https%3A%2F%2Fcms-cdn.avascan.com%2Fcms2%2Favax-icon.de4ce0ba59ea.png&w=32&q=75', url: 'https://snowtrace.dev/tx/' + content.txHash })
    .setDescription(`Token - ${content.tokenName} - Symbol - $${content.tokenSymbol}`)
    .addFields(
      { name: 'Contract Verification', value: content.isVerified ? 'Verified ✅' : 'Not Verified ❌' },
      { name: `Charts`, value: `[Dexscreener Chart 📉](${content.dexScreenerURL})`},
      { name: 'Contract Creation Date 📅', value: `<t:${content.creationTimestamp}>` },
      { name: 'Contract Address', value: content.contractAddress, inline: true },
      { name: 'Method', value: 'Liquidity Added', inline: true },
    )
    .setTimestamp()
    .setFooter({ text: '**Ape with risk 🙈', iconURL: 'https://cdn.routescan.io/_next/image?url=https%3A%2F%2Fcms-cdn.avascan.com%2Fcms2%2Favax-icon.de4ce0ba59ea.png&w=32&q=25' });

  channel.send({ embeds: [exampleEmbed] });
}


module.exports = { getListener }