if (process.env.MODE !== 'tron') {
    require('any-promise/register/bluebird');
    window.Web3 = require('web3');
    window.abi = require('human-standard-token-abi');
    window.WAValidator = require('wallet-address-validator');

} else {

    window.TronWeb = require('tronweb');
    window.TronHttpProvider = window.TronWeb.providers.HttpProvider;
}

// const fullNode = new HttpProvider('https://api.trongrid.io'); // Full node http endpoint
// const solidityNode = new HttpProvider('https://api.trongrid.io:'); // Solidity node http endpoint
// const eventServer = 'https://api.trongrid.io'; // Contract events http endpoint

