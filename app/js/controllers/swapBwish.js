angular.module('Constants').constant('SWAP_WISH_BNB', {

    'TEST_CONNECT_ADDRESS': '0x58dab2f7a864d4fa66918fbcb4edf92c43a45ab4',
    'CONNECT_ADDRESS': '0x8b748672f7ff9c46647106c7c735e33bfbaca47b',

    'TEST_BURN_ADDRESS': '0x09330972ef9c7fc12d4b803c80024d54f5aa4e31',
    'BURN_ADDRESS': '0x346a8e2a7fe29e32b9174c408a84ef1c7ed7408f',

    'ABI': [
        {
            "constant": true,
            "inputs": [
                {
                    "name": "",
                    "type": "address"
                }
            ],
            "name": "registers",
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
            "constant": false,
            "inputs": [],
            "name": "renounceOwnership",
            "outputs": [],
            "payable": false,
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "constant": true,
            "inputs": [],
            "name": "owner",
            "outputs": [
                {
                    "name": "",
                    "type": "address"
                }
            ],
            "payable": false,
            "stateMutability": "view",
            "type": "function"
        },
        {
            "constant": true,
            "inputs": [],
            "name": "isOwner",
            "outputs": [
                {
                    "name": "",
                    "type": "bool"
                }
            ],
            "payable": false,
            "stateMutability": "view",
            "type": "function"
        },
        {
            "constant": false,
            "inputs": [
                {
                    "name": "newOwner",
                    "type": "address"
                }
            ],
            "name": "transferOwnership",
            "outputs": [],
            "payable": false,
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "anonymous": false,
            "inputs": [
                {
                    "indexed": true,
                    "name": "eth",
                    "type": "address"
                },
                {
                    "indexed": true,
                    "name": "bnb",
                    "type": "string"
                }
            ],
            "name": "Put",
            "type": "event"
        },
        {
            "anonymous": false,
            "inputs": [
                {
                    "indexed": true,
                    "name": "previousOwner",
                    "type": "address"
                },
                {
                    "indexed": true,
                    "name": "newOwner",
                    "type": "address"
                }
            ],
            "name": "OwnershipTransferred",
            "type": "event"
        },
        {
            "constant": false,
            "inputs": [
                {
                    "name": "_bnb",
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
            "constant": false,
            "inputs": [
                {
                    "name": "_token",
                    "type": "address"
                },
                {
                    "name": "_to",
                    "type": "address"
                },
                {
                    "name": "_value",
                    "type": "uint256"
                }
            ],
            "name": "transfer",
            "outputs": [],
            "payable": false,
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "constant": false,
            "inputs": [
                {
                    "name": "_token",
                    "type": "address"
                },
                {
                    "name": "_spender",
                    "type": "address"
                },
                {
                    "name": "_value",
                    "type": "uint256"
                }
            ],
            "name": "approve",
            "outputs": [],
            "payable": false,
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "constant": false,
            "inputs": [
                {
                    "name": "token",
                    "type": "address"
                },
                {
                    "name": "from",
                    "type": "address"
                },
                {
                    "name": "to",
                    "type": "address"
                },
                {
                    "name": "value",
                    "type": "uint256"
                }
            ],
            "name": "transferFrom",
            "outputs": [],
            "payable": false,
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "constant": false,
            "inputs": [
                {
                    "name": "token",
                    "type": "address"
                },
                {
                    "name": "value",
                    "type": "uint256"
                }
            ],
            "name": "burn",
            "outputs": [],
            "payable": false,
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "constant": false,
            "inputs": [
                {
                    "name": "token",
                    "type": "address"
                },
                {
                    "name": "from",
                    "type": "address"
                },
                {
                    "name": "value",
                    "type": "uint256"
                }
            ],
            "name": "burnFrom",
            "outputs": [],
            "payable": false,
            "stateMutability": "nonpayable",
            "type": "function"
        }
    ]
});






angular.module('app').controller('swapBwishController', function($scope, SWAP_WISH_BNB, web3Service, $timeout) {

    var isProduction = location.protocol === "https:";

    $scope.copied = {};

    $scope.abi = SWAP_WISH_BNB.ABI;

    $scope.address = isProduction ? SWAP_WISH_BNB.CONNECT_ADDRESS : SWAP_WISH_BNB.TEST_CONNECT_ADDRESS;
    $scope.burn_address = isProduction ? SWAP_WISH_BNB.BURN_ADDRESS : SWAP_WISH_BNB.TEST_BURN_ADDRESS;

    $scope.request = {};
    $scope.registeredEthAddress = false;

    web3Service.setProviderByNumber(1);
    $scope.web3Contract = web3Service.createContractFromAbi($scope.address, $scope.abi);

    $scope.sendTransaction = function() {
        contract.methods.finishMinting().send({
            from: $scope.currentWallet.wallet
        }).then(console.log);
    };


    var latestCheckAddress, addressCheckTimeout;


    $scope.checkETHProgress = false;
    $scope.checkETHAddress = function(repeatAddress) {
        $scope.registeredEthAddress = false;
        if (!$scope.request.eth_address || (repeatAddress && (repeatAddress !== $scope.request.eth_address))) {
            return;
        }
        latestCheckAddress = $scope.request.eth_address;
        if (!repeatAddress) {
            $scope.checkETHProgress = true;
        }
        $scope.web3Contract.methods.registers($scope.request.eth_address.toLowerCase()).call(function(error, result) {
            if (latestCheckAddress !== $scope.request.eth_address) {
                return;
            }
            if (result) {
                $scope.registeredEthAddress = true;
                $scope.request.bnb_address = result;
            } else {
                addressCheckTimeout = $timeout(function() {
                    $scope.checkETHAddress(latestCheckAddress);
                }, 5000);
            }
            $scope.checkETHProgress = false;
            $scope.$apply();
        });
    };

    $scope.$on('$destroy', function() {
        addressCheckTimeout ?
            $timeout.cancel(addressCheckTimeout) : false;
    });

}).controller('sawpBNBInstruction', function(web3Service, $scope) {

    var web3Contract;

    $scope.contractDetails = $scope.ngPopUp.params.contract;

    $scope.formParams = $scope.ngPopUp.params.request;

    web3Service.getAccounts(1).then(function(result) {
        $scope.currentWallet = result.filter(function(wallet) {
            return wallet.wallet.toLowerCase() === $scope.ngPopUp.params.request.eth_address.toLowerCase();
        })[0];
        if ($scope.currentWallet) {
            web3Service.setProvider($scope.currentWallet.type, 1);
        } else {
            web3Service.setProviderByNumber(1);
        }

        web3Contract = web3Service.createContractFromAbi($scope.ngPopUp.params.contract.address, $scope.ngPopUp.params.contract.abi);

        var registerMethod = web3Service.getMethodInterface('put', $scope.contractDetails.abi);
        $scope.assignAddressSignature =
            (new Web3()).eth.abi.encodeFunctionCall(registerMethod, [$scope.formParams.bnb_address]);

    });

    $scope.sendRegisterAccountTransaction = function() {
        web3Contract.methods.put($scope.formParams.bnb_address).send({
            from: $scope.currentWallet.wallet
        }).then(function(result) {
            console.log(result);
        }, function(error) {
            console.log(error);
        });
    };
});