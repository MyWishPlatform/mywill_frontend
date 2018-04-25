angular.module('app').controller('contractsPreviewController', function($scope, NETWORKS_TYPES_NAMES_CONSTANTS,
                                                                        CONTRACT_STATUSES_CONSTANTS, FileSaver, web3Service) {
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

    var url = 'https://www.myetherwallet.com/?';
    var params = [
        'sendMode=ether'
    ];
    var depositUrl = url + params.join('&');
    var killUrl = url + params.join('&');

    $scope.setContract = function(contract) {
        $scope.contract = contract;
        $scope.contract.stateValue = $scope.statuses[$scope.contract.state]['value'];
        $scope.contract.stateTitle = $scope.statuses[$scope.contract.state]['title'];
        $scope.contract.networkName = NETWORKS_TYPES_NAMES_CONSTANTS[$scope.contract.network || 1];
        contract.balance = undefined;
        $scope.contract.discount = 0;

        if (!contract.contract_details.eth_contract) return;
        var depositParams = ['to=' + contract.contract_details.eth_contract.address, 'gaslimit=30000', 'value=0'];
        var killParams = ['to=' + contract.contract_details.eth_contract.address, 'data=0x41c0e1b5', 'gaslimit=40000', 'value=0'];
        contract.depositUrl = depositUrl + '&' + depositParams.join('&');
        contract.killUrl = killUrl + '&' + killParams.join('&');

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


}).controller('instructionsController', function($scope, web3Service) {
    var web3 = web3Service.web3();
    var contractDetails = $scope.ngPopUp.params.contract.contract_details, contract;
    var killInterfaceMethod = web3Service.getMethodInterface('kill', contractDetails.eth_contract.abi);
    $scope.killSignature = (new Web3()).eth.abi.encodeFunctionCall(killInterfaceMethod);
    var iAliveInterfaceMethod = web3Service.getMethodInterface('imAvailable', contractDetails.eth_contract.abi);
    $scope.iAliveSignature = (new Web3()).eth.abi.encodeFunctionCall(iAliveInterfaceMethod);
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
});
