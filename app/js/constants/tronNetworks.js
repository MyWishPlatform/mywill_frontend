var module = angular.module('Constants');
module.constant('TRON_NETWORKS_CONSTANTS',
    {
        "TESTNET": {
            FULL_NODE: new window.TronHttpProvider('https://api.shasta.trongrid.io'),
            SOLIDITY_NODE: new window.TronHttpProvider('https://api.shasta.trongrid.io'),
            // EVENT_SERVER: 'https://api.shasta.trongrid.io/'
            EVENT_SERVER: 'https://api.shasta.trongrid.io/',
            API: 'https://api.shasta.trongrid.io'
        },
        "MAINNET": {
            FULL_NODE: new window.TronHttpProvider('https://api.trongrid.io'),
            // FULL_NODE: new window.TronHttpProvider('https://tronmainnet.mywish.io'),
            SOLIDITY_NODE: new window.TronHttpProvider('https://api.trongrid.io'),
            // SOLIDITY_NODE: new window.TronHttpProvider('https://tronmainnet.mywish.io'),
            EVENT_SERVER: 'https://api.trongrid.io/',
            API: 'https://apilist.tronscan.org'
            // EVENT_SERVER: 'https://tronmainnet.mywish.io/'
        }
    }
);
