var module = angular.module('Constants');
module.constant('TRON_NETWORKS_CONSTANTS',
    {
        "TESTNET": {
            FULL_NODE: new window.TronHttpProvider('https://api.shasta.trongrid.io'),
            SOLIDITY_NODE: new window.TronHttpProvider('https://api.shasta.trongrid.io'),
            EVENT_SERVER: 'https://api.shasta.trongrid.io/'
        },
        "MAINNET": {
            FULL_NODE: new window.TronHttpProvider('https://api.trongrid.io'),
            SOLIDITY_NODE: new window.TronHttpProvider('https://api.trongrid.io'),
            EVENT_SERVER: 'https://api.trongrid.io/'
        }
    }
);