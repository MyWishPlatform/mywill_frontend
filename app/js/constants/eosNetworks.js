var module = angular.module('Constants');

// https://monitor.jungletestnet.io/#apiendpoints

module.constant('EOS_NETWORKS_CONSTANTS', [
    {
        "name": "MAINNET",
        "description": "The EOS Mainnet",
        "owner": "The EOS community",
        "chainId": "aca376f206b8fc25a6ed44dbdc66547c36c6c33e3a119ffbeaef943642f0e906",
        "type": "mainnet",
        "network": "eos",
        "endpoints": [
            {
                "name": "Latest",
                "protocol": "https",
                "port": 443,
                "url": "api.eosdetroit.io",
                "description": "API Node"
            },
            {
                "name": "EOS MyWish",
                "protocol": "https",
                "port": 443,
                "url": "eos-node.mywish.io",
                "description": "API Node"
            },
            {
                "name": "EOS Nation",
                "protocol": "https",
                "port": 443,
                "url": "api.eosn.io",
                "description": "API Node"
            },
            {
                "name": "EOS New York",
                "protocol": "https",
                "port": 443,
                "url": "api.eosnewyork.io",
                "description": "API Node"
            },
            {
                "name": "EOS Detroit",
                "protocol": "https",
                "port": 443,
                "url": "api.eosdetroit.io",
                "description": "API Node"
            },
            {
                "name": "Greymass",
                "protocol": "https",
                "port": 443,
                "url": "eos.greymass.com",
                "description": "API Node"
            },
            {
                "name": "Cypherglass",
                "protocol": "https",
                "port": 443,
                "url": "api.cypherglass.com",
                "description": "API Node"
            },
            {
                "name": "GenerEOS",
                "protocol": "https",
                "port": 443,
                "url": "mainnet.genereos.io",
                "description": "Public node provided by GenerEOS"
            },
            {
                "name": "Scatter Load Balancer",
                "protocol": "https",
                "port": 443,
                "url": "nodes.get-scatter.com",
                "description": "Load balancer of various public nodes provided by scatter"
            }
        ]
    },
    {
        "name": "TESTNET",
        "description": "Welcome to the Jungle",
        "owner": "cryptolions",
        "chainId": "e70aaab8997e1dfce58fbfac80cbbb8fecec7b99cf982a9444273cbc64c41473",
        "type": "testnet",
        "network": "eos",
        "endpoints": [
            {
                "protocol": "https",
                "url": "jungle2.cryptolions.io",
                "port": 443
            },
            {
                "protocol": "http",
                "url": "jungle2.cryptolions.io",
                "port": 80
            },
            {
                "name": "MyWish",
                "protocol": "https",
                "port": 443,
                "url": "jungle-node.mywish.io",
                "description": ""
            },
            {
                "name": "EOS Costa Rica",
                "protocol": "https",
                "port": 443,
                "url": "jungle.eosio.cr",
                "description": "Public node provided by EOS Costa Rica"
            },
            {
                "name": "EOSMetal",
                "protocol": "https",
                "port": 443,
                "url": "junglenodes.eosmetal.io",
                "description": "HA Proxy node provided by EOSMetal"
            }
        ]
    }
]);
