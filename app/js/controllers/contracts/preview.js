angular.module('app').controller('contractsPreviewController', function($scope, $rootScope, CONTRACT_STATUSES_CONSTANTS, FileSaver, web3Service) {
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

    $scope.setContract = function(contract) {

        $scope.contract = contract;
        $scope.contract.stateValue = $scope.statuses[$scope.contract.state]['value'];
        $scope.contract.stateTitle = $scope.statuses[$scope.contract.state]['title'];
        contract.balance = undefined;
        $scope.contract.discount = 0;

        if (!contract.contract_details.eth_contract) return;

        contract.currency = ((contract.network == 1) || (contract.network == 2)) ? 'ETH' :
            ((contract.network == 3) || (contract.network == 4)) ? 'SBTC' : 'Unknown';

        $scope.networkName = contract.currency;

        web3Service.setProviderByNumber(contract.network);

        if (contract.contract_details.eth_contract.address) {
            web3Service.getBalance(contract.contract_details.eth_contract.address).then(function(result) {
                contract.balance = Web3.utils.fromWei(result, 'ether');
            });
        }
    };
    $scope.changePromoCode = function(contract) {
        contract.discountError = false;
        contract.discount = 0;
    };


}).controller('depositInstructionController', function($scope, web3Service) {
    var contractDetails = $scope.ngPopUp.params.contract.contract_details;
    if ($scope.ngPopUp.params.contract.contract_type === 8) {
        web3Service.getTokenInfo(
            $scope.ngPopUp.params.contract.network,
            $scope.ngPopUp.params.contract.contract_details.token_address,
            false,
            ['symbol']
        ).then(function(result) {
            $scope.depositUrl =
                'https://www.myetherwallet.com/?sendMode=token&to=' +
                contractDetails.eth_contract.address + '&gaslimit=100000&value=0&symbol=' + result.symbol + '#send-transaction';
        });
    } else {
        $scope.depositUrl =
            'https://www.myetherwallet.com/?sendMode=ether&to=' +
            contractDetails.eth_contract.address + '&gaslimit=30000&value=0#send-transaction';
    }
}).controller('instructionsController', function($scope, web3Service) {
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
