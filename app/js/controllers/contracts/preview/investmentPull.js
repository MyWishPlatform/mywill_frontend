angular.module('app').controller('investmentPullPreviewController', function($timeout, $rootScope, contractService, $state,
                                                                             openedContract, $scope, web3Service, $window) {
    $scope.contract = openedContract.data;
    $scope.details = $scope.contract.contract_details;

    $scope.details.hard_cap_eth = $rootScope.web3Utils.fromWei($scope.details.hard_cap, 'ether');
    $scope.details.soft_cap_eth = $rootScope.web3Utils.fromWei($scope.details.soft_cap, 'ether');

    $scope.details.min_wei = $scope.details.min_wei ? $rootScope.web3Utils.fromWei($scope.details.min_wei, 'ether') : false;
    $scope.details.max_wei = $scope.details.max_wei ? $rootScope.web3Utils.fromWei($scope.details.max_wei, 'ether') : false;

    $scope.iniContract($scope.contract);

    if ($scope.contract.contract_details.token_address) {
        web3Service.getTokenInfo(
            $scope.contract.network,
            $scope.contract.contract_details.token_address,
            false,
            ['decimals', 'symbol']
        ).then(function(result) {
            $scope.tokenInfo = result;
        });
    }

    if ((($scope.contract.stateValue == 4) || ($scope.contract.stateValue == 11)) && $scope.details.whitelist) {
        contractService.getWhiteList($scope.contract.id, {limit: 1}).then(function(response) {
            $scope.whiteListedAddresses = response.data;
        });
    }

    $scope.contractUrl = $window.location.origin + $state.href('main.contracts.preview.public', {key: $scope.details.link});

}).controller('investmentPoolCancelController', function($scope, web3Service) {

    var contractData = $scope.ngPopUp.params.contract;
    $scope.contract = contractData;

    web3Service.setProviderByNumber(contractData.network);

    var contractDetails = contractData.contract_details, contract;

    var methodName = 'cancel';
    var contractInfo = contractDetails.eth_contract;
    var interfaceMethod = web3Service.getMethodInterface(methodName, contractInfo.abi);

    try {
        $scope.killSignature = (new Web3()).eth.abi.encodeFunctionCall(interfaceMethod);
    } catch(err) {
        console.log(err);
    }

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
}).controller('investmentPoolSendFundsController', function($scope, web3Service) {

    var contractData = $scope.ngPopUp.params.contract;
    $scope.contract = contractData;

    web3Service.setProviderByNumber(contractData.network);

    var contractDetails = contractData.contract_details, contract;

    var methodName = 'finalize';
    var contractInfo = contractDetails.eth_contract;
    var interfaceMethod = web3Service.getMethodInterface(methodName, contractInfo.abi);

    try {
        $scope.sendFundsSignature = (new Web3()).eth.abi.encodeFunctionCall(interfaceMethod);
    } catch(err) {
        console.log(err);
    }

    $scope.wallets = {};

    web3Service.getAccounts(contractData.network).then(function(result) {
        result.map(function(wallet) {
            $scope.wallets[wallet.type] = $scope.wallets[wallet.type] || [];
            $scope.wallets[wallet.type].push(wallet.wallet);
        });
    });

    $scope.showedParityWallets = false;
    $scope.showParityWallets = function() {
        $scope.showedParityWallets = !$scope.showedParityWallets;
    };
    $scope.sendTransaction = function(walletType, wallet) {
        web3Service.setProvider(walletType, contractData.network);
        contract = web3Service.createContractFromAbi(contractInfo.address, contractInfo.abi);
        contract.methods[methodName]().send({
            from: wallet
        }).then(console.log);
    };
}).controller('investmentPoolGetTokensController', function($scope, web3Service) {

    var contractData = $scope.ngPopUp.params.contract;
    $scope.contract = contractData;

    web3Service.setProviderByNumber(contractData.network);

    var contractDetails = contractData.contract_details, contract;

    var methodName = 'withdrawTokens';
    var contractInfo = contractDetails.eth_contract;
    var interfaceMethod = web3Service.getMethodInterface(methodName, contractInfo.abi);

    try {
        $scope.withdrawTokensSignature = (new Web3()).eth.abi.encodeFunctionCall(interfaceMethod);
    } catch(err) {
        console.log(err);
    }

    $scope.wallets = {};

    web3Service.getAccounts(contractData.network).then(function(result) {
        result.map(function(wallet) {
            $scope.wallets[wallet.type] = $scope.wallets[wallet.type] || [];
            $scope.wallets[wallet.type].push(wallet.wallet);
        });
    });

    $scope.showedParityWallets = false;
    $scope.showParityWallets = function() {
        $scope.showedParityWallets = !$scope.showedParityWallets;
    };
    $scope.sendTransaction = function(walletType, wallet) {
        web3Service.setProvider(walletType, contractData.network);
        contract = web3Service.createContractFromAbi(contractInfo.address, contractInfo.abi);
        contract.methods[methodName]().send({
            from: wallet
        }).then(console.log);
    };
});
