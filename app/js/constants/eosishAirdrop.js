angular.module('app').constant('AIRDROP_TOOL', {
    "CONTRACT_ADDRESS": "0x215a044ee1961dd1de057a3c6c273131060e2531",
    "ABI": [
        {
            "constant": false,
            "inputs": [
                {
                    "name": "_eosAccountName",
                    "type": "string"
                }
            ],
            "name": "put",
            "outputs": [],
            "payable": false,
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "constant": true,
            "inputs": [],
            "name": "get",
            "outputs": [
                {
                    "name": "",
                    "type": "string"
                }
            ],
            "payable": false,
            "stateMutability": "view",
            "type": "function"
        },
        {
            "constant": true,
            "inputs": [
                {
                    "name": "_addr",
                    "type": "address"
                }
            ],
            "name": "get",
            "outputs": [
                {
                    "name": "result",
                    "type": "string"
                }
            ],
            "payable": false,
            "stateMutability": "view",
            "type": "function"
        },
        {
            "anonymous": false,
            "inputs": [
                {
                    "indexed": true,
                    "name": "",
                    "type": "address"
                },
                {
                    "indexed": false,
                    "name": "",
                    "type": "string"
                },
                {
                    "indexed": false,
                    "name": "",
                    "type": "bytes32"
                }
            ],
            "name": "RegisterAdd",
            "type": "event"
        }]
    }
);