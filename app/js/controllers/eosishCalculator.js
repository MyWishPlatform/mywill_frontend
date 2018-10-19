angular.module('app').controller('eosishCalculatorController', function($scope, EOSISHCalculatorService, web3Service, AIRDROP_TOOL) {


    $scope.request = {};
    $scope.eosishBalances = {};

    var checkAddressTimeout;
    $scope.checkedEthAddress = false;

    var isProduction = (location.host.indexOf('eos.mywish.io') === 0) || (location.host.indexOf('contracts.mywish.io') > -1);

    $scope.network = isProduction ? 1 : 2;
    var contractAddress = isProduction ? AIRDROP_TOOL.CONTRACT_ADDRESS_MAINNET : AIRDROP_TOOL.CONTRACT_ADDRESS;

    web3Service.setProviderByNumber($scope.network);

    var web3 = web3Service.web3();

    var getEOSAddress = function(addressField) {
        var address = Web3.utils.toChecksumAddress($scope.request.eth_address);
        var enteredAddress = $scope.request.eth_address;
        var contract = web3Service.createContractFromAbi(contractAddress, AIRDROP_TOOL.ABI);
        contract.methods.get(address).call(function(error, response) {
            if (error || (enteredAddress != $scope.request.eth_address)) {
                $scope.balanceInProgress = false;
                $scope.$apply();
                return;
            }
            $scope.checkedEthAddress = true;
            $scope.checkedEOSAccount = response;
            $scope.$apply();
        });
    };

    $scope.checkEthAddress = function(ethForm) {
        $scope.eosishBalances.eth = false;
        $scope.checkedEthAddress = false;
        $scope.checkedEOSAccount = false;
        if (!ethForm.$valid) return;
        getEOSAddress($scope.request.eth_address);
        EOSISHCalculatorService.getBalance($scope.request.eth_address, 'eth').then(function(response) {
            $scope.eosishBalances.eth = new BigNumber(response.data.result).div(Math.pow(10, 18)).round(4).toString(10);
        });
    };

    $scope.checkEosAddress = function() {
        EOSISHCalculatorService.getBalance($scope.request.eos_address, 'eos').then(function(response) {
            var balance = new BigNumber(response.data.result).div(Math.pow(10, 4)).minus(100);

            if (balance > 0) {
                $scope.eosishBalances.eos = balance.div(50).round(4).toString(10)
            } else {
                $scope.eosishBalances.eos = '0';
            }
            console.log(response);
        });
    };

    $scope.resetEosBalance = function() {
        $scope.eosishBalances.eos = false;
    };

});
