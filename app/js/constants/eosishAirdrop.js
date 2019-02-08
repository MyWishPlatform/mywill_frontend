angular.module('app').constant('AIRDROP_TOOL', {
    "CONTRACT_ADDRESS": "0x215a044ee1961dd1de057a3c6c273131060e2531",
    "CONTRACT_ADDRESS_MAINNET": "0xc1be9895d1fe36f164f5b878a76865205ecb40b7",
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


angular.module('app').constant('AIRDROP_TRONISH_TOOL', {
    "CONTRACT_ADDRESS": "0x83d06a33f9bfd9b66a07052dd6830b82ac95b353",
    "CONTRACT_ADDRESS_MAINNET": "0x75d2befc8d167cf8a6af89fdef944bb12bfb87b0",
    "EOS_CONTRACT_ADDRESS": "kolyankolyan",
    "EOS_CONTRACT_ADDRESS_MAINNET": "eostronlinke",
    "TRON_CONTRACT_ADDRESS": "418a6386479dbb3063eabb3d6fa92ed376ab06ee14",
    "TRON_CONTRACT_ADDRESS_MAINNET": "41fe20a0f410e5fbe0ebbc47ff4e965aded601acda",
    "TRON_ABI": [
        {
            "anonymous": false,
            "inputs": [
                {
                    "indexed": true,
                    "name": "tronAddress",
                    "type": "address"
                }
            ],
            "name": "RegisterAdd",
            "type": "event"
        },
        {
            "constant": false,
            "inputs": [],
            "name": "put",
            "outputs": [],
            "payable": false,
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "constant": true,
            "inputs": [
                {
                    "name": "_tronAddress",
                    "type": "address"
                }
            ],
            "name": "isRegistered",
            "outputs": [
                {
                    "name": "",
                    "type": "bool"
                }
            ],
            "payable": false,
            "stateMutability": "view",
            "type": "function"
        }
    ],
    "ABI": [
        {
            "anonymous": false,
            "inputs": [
                {
                    "indexed": true,
                    "name": "ethAddress",
                    "type": "address"
                },
                {
                    "indexed": true,
                    "name": "tronAddress",
                    "type": "address"
                }
            ],
            "name": "RegisterAdd",
            "type": "event"
        },
        {
            "constant": false,
            "inputs": [
                {
                    "name": "_tronAddress",
                    "type": "address"
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
            "inputs": [
                {
                    "name": "_ethAddress",
                    "type": "address"
                }
            ],
            "name": "get",
            "outputs": [
                {
                    "name": "_tronAddress",
                    "type": "address"
                }
            ],
            "payable": false,
            "stateMutability": "view",
            "type": "function"
        }
    ]
});