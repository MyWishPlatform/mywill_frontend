angular.module('app').controller('contractsPreviewController', function($scope, $rootScope, contractService, CONTRACT_STATUSES_CONSTANTS, FileSaver, web3Service) {
    // console.log('contractsPreviewController',$scope)
    $scope.statuses = CONTRACT_STATUSES_CONSTANTS;
    $scope.contract = false;

    $scope.selectedContract = false;
    $scope.showedTab = 'info';

    $scope.goTo = function(tab, contractType) {
        $scope.showedTab = tab;
        $scope.selectedContract = contractType;
    };
    $scope.saveAsFile = function(data, name) {
        data = new Blob([data], { type: 'text/plain;charset=utf-8' });
        FileSaver.saveAs(data, name + '.sol');
    };

    $scope.changePromoCode = function(contract) {
        contract.discountError = false;
        contract.cost = contract.original_cost;
    };

    contractService.getVerificationCost().then(function(response) {
        console.log('contractsPreviewController getVerificationCost',response.data)
        contract.verificationCost = {
            WISH: new BigNumber(response.data.WISH).div(Math.pow(10, 18)).round(2).toString(10),
            ETH: new BigNumber(response.data.ETH).div(Math.pow(10, 18)).round(2).toString(10),
            USDT: new BigNumber(response.data.USDT).div(Math.pow(10, 6)).round(2).toString(10),
        };
    });

}).controller('depositInstructionController', function($scope, web3Service, $timeout) {
    console.log('depositInstructionController',$scope)
    var contract;
    var contractData = $scope.ngPopUp.params.contract;
    var contractDetails = contractData.contract_details;
    $scope.dataFields = {};

    var contractType;
    switch (contractData.contract_type) {
        case 8:
        case 29:
            contractType = 'token';
            break;
        default:
            contractType = 'coin';
            break;
    }

    if (contractType === 'token') {
        web3Service.setProviderByNumber(contractData.network);
        web3Service.getTokenInfo(
            contractData.network,
            contractDetails.token_address,
            false,
            ['decimals', 'symbol']
        ).then(function(result) {
            $scope.tokenInfo = result;
        });
    } else {
        $scope.tokenInfo = {
            decimals: '18',
            symbol: contractData.blockchain || 'ETH'
        };
    }

    var decimalsAmount = '0';
    var adminAddress = contractDetails.admin_address || contractDetails.user_address;

    $scope.goToTransaction = function() {
        var powerNumber = new BigNumber('10').toPower($scope.tokenInfo.decimals || 0);
        decimalsAmount = new BigNumber($scope.dataFields.amount).times(powerNumber).toString(10);

        web3Service.getAccounts(contractData.network).then(function(result) {
            $scope.currentWallet = result.filter(function(wallet) {
                return wallet.wallet.toLowerCase() === adminAddress.toLowerCase();
            })[0];
            if ($scope.currentWallet) {
                web3Service.setProvider($scope.currentWallet.type, contractData.network);
            }

            if (contractType === 'token') {
                contract = web3Service.createContractFromAbi(
                    contractDetails.token_address, window.abi
                );
                var interfaceMethod = web3Service.getMethodInterface('transfer', window.abi);
                var transferSignature = (new Web3()).eth.abi.encodeFunctionCall(interfaceMethod, [contractDetails.eth_contract.address, decimalsAmount]);
                $scope.instructionDataModal = {
                    'dataField': transferSignature,
                    'ownerAddress': adminAddress,
                    'contractAddress': contractDetails.eth_contract.address,
                    'contract': {
                        network: contractData.network,
                        blockchain: contractData.blockchain
                    }
                }
            } else {
                $scope.instructionDataModal = {
                    'dataField': false,
                    'ownerAddress': adminAddress,
                    'contractAddress': contractDetails.eth_contract.address,
                    'amount': $scope.dataFields.amount,
                    'contract': {
                        network: contractData.network,
                        blockchain: contractData.blockchain
                    }
                }
            }

            $timeout(function() {
                $scope.dataFields.sendTransaction = true;
                $scope.$apply();
                $scope.$parent.$broadcast('changeContent');
            });
        });

    };

    $scope.sendTransaction = function() {
        if (contractType === 'token') {
            contract.methods.transfer(contractDetails.eth_contract.address, decimalsAmount).send({
                from: $scope.currentWallet.wallet
            }).then(console.log);
        } else {
            web3Service.web3().eth.sendTransaction({
                value: decimalsAmount,
                from: adminAddress,
                to: contractDetails.eth_contract.address
            }, function() {
                console.log(arguments);
            });
        }
    };

}).controller('instructionsController', function($scope, web3Service) {
    console.log('instructionsController',$scope)
    var web3 = web3Service.web3();
    var contractDetails = $scope.ngPopUp.params.contract.contract_details, contract;

    var killInterfaceMethod = web3Service.getMethodInterface('kill', contractDetails.eth_contract.abi);
    if (killInterfaceMethod) {
        $scope.killSignature = (new Web3()).eth.abi.encodeFunctionCall(killInterfaceMethod);
    }
    var iAliveInterfaceMethod = web3Service.getMethodInterface('imAvailable', contractDetails.eth_contract.abi);
    if (iAliveInterfaceMethod) {
        $scope.iAliveSignature = (new Web3()).eth.abi.encodeFunctionCall(iAliveInterfaceMethod);
    }
    web3Service.getAccounts($scope.ngPopUp.params.contract.network).then(function(result) {
        $scope.currentWallet = result.filter(function(wallet) {
            return wallet.wallet.toLowerCase() === contractDetails.user_address.toLowerCase();
        })[0];
        if ($scope.currentWallet) {
            web3Service.setProvider($scope.currentWallet.type, $scope.ngPopUp.params.contract.network);
            contract = web3Service.createContractFromAbi(contractDetails.eth_contract.address, contractDetails.eth_contract.abi);
        }
    });
    $scope.sendDeposit = function() {
        web3.eth.sendTransaction({
            to: contractDetails.eth_contract.address,
            from: $scope.currentWallet.wallet
        }, console.log);
    };
    $scope.killContract = function() {
        contract.methods.kill().send({
            from: $scope.currentWallet.wallet
        }).then(console.log);
    };
    $scope.sendIAlive = function() {
        contract.methods.imAvailable().send({
            from: $scope.currentWallet.wallet
        }).then(console.log);
    };
}).controller('setAddressController', function($scope, $rootScope, web3Service, $timeout) {
    console.log('setAddressController',$scope)

    $scope.showInstruction = function() {
        createSignature();
        $timeout(function() {
            $scope.showedInstruction  = true;
            $scope.$apply();
            $scope.$parent.$broadcast('changeContent');
        });
    };
    $scope.hideInstruction = function() {
        $scope.showedInstruction  = false;
    };

    var contractData = $scope.ngPopUp.params.contract;

    $scope.contract = contractData;

    web3Service.setProviderByNumber(contractData.network);

    var contractDetails = contractData.contract_details, contract;

    var methodName = $scope.ngPopUp.params.web3Method;
    var contractInfo = contractDetails.eth_contract;
    var interfaceMethod = web3Service.getMethodInterface(methodName, contractInfo.abi);

    $scope.request = {
        address: ''
    };

    var createSignature = function() {
        $scope.request.address = $scope.request.address;
        try {
            $scope.setAddressSignature = (new Web3()).eth.abi.encodeFunctionCall(interfaceMethod, [$scope.request.address.toLowerCase()]);
        } catch(err) {
            console.log(err);
        }
    };


    web3Service.getAccounts(contractData.network).then(function(result) {
        $scope.currentWallet = result.filter(function(wallet) {
            return wallet.wallet.toLowerCase() === contractDetails.admin_address.toLowerCase();
        })[0];
        if ($scope.currentWallet) {
            web3Service.setProvider($scope.currentWallet.type, contractData.network);
            contract = web3Service.createContractFromAbi(contractInfo.address, contractInfo.abi);
        }
    });

    $scope.sendTransaction = function() {
        contract.methods[methodName]($scope.request.address).send({
            from: $scope.currentWallet.wallet
        }).then(console.log);
    };

    $scope.checkTokenAddress = function(addressForm) {
        if (!$scope.ngPopUp.params.isToken) return;
        $scope.tokenInfo = false;
        addressForm.address.$setValidity('contract-address', true);
        if (!addressForm.$valid) return;
        addressForm.address.$setValidity('required', false);
        web3Service.getTokenInfo(
            $scope.contract.network,
            $scope.request.address.toLowerCase(),
            false,
            ['decimals', 'symbol']
        ).then(function(result) {
            addressForm.address.$setValidity('required', true);
            if (!(result.symbol && result.decimals)) {
                addressForm.address.$setValidity('contract-address', false);
                return;
            }
            addressForm.address.$setValidity('contract-address', true);
            $scope.tokenInfo = result;
        });
    };

});
