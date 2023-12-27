const { ethers } = require('ethers');
const routerABI = require('../abis/router.json')
const erc20ABI = require('../abis/erc20.json')
const swapABI = require('../abis/swap.json')
require('dotenv').config()

const providerJSON = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);
const providerWSS = new ethers.providers.JsonRpcProvider(process.env.WSS_URL);

const getGas = async() => {
    var res = await providerJSON.getGasPrice()
    return Math.round(ethers.utils.formatUnits(res, "gwei"))
}

module.exports = {providerJSON, providerWSS, getGas, routerABI, erc20ABI, swapABI}
  