require('any-promise/register/bluebird');
window.Web3 = require('web3');
window.abi = require('human-standard-token-abi');
window.WAValidator = require('wallet-address-validator');
window.TronWeb = require('tronweb');
window.TronHttpProvider = window.TronWeb.providers.HttpProvider;
window.Eos = require('eosjs');
window.NewEos = require('eosjs-ecc');