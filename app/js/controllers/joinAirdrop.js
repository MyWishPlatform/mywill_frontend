angular.module('app').controller('joinAirdropController', function($scope, $timeout, EOSService, web3Service, AIRDROP_TOOL) {

    var checkAddressTimeout;
    $scope.checkedEthAddress = false;

    var isProduction = true || (location.host.indexOf('eos.mywish.io') === 0) || (location.host.indexOf('contracts.mywish.io') > -1);

    $scope.network = isProduction ? 1 : 2;
    var contractAddress = isProduction ? AIRDROP_TOOL.CONTRACT_ADDRESS_MAINNET : AIRDROP_TOOL.CONTRACT_ADDRESS;

    web3Service.setProviderByNumber($scope.network);

    var web3 = web3Service.web3();

    var getEOSAddress = function(addressField) {
        var address = Web3.utils.toChecksumAddress(addressField.$viewValue);
        var enteredAddress = addressField.$viewValue;
        var contract = web3Service.createContractFromAbi(contractAddress, AIRDROP_TOOL.ABI);
        contract.methods.get(address).call(function(error, response) {
            if (error || (enteredAddress != addressField.$viewValue)) {
                $scope.balanceInProgress = false;
                $scope.$apply();
                return;
            }
            $scope.checkedEOSAccount = response;
            $scope.$apply();
        });
    };

    var checkBalanceTimer;
    $scope.checkETHAddress = function(addressField) {
        $scope.checkedEthAddress = false;
        $scope.checkedEOSAccount = false;
        if (!addressField.$valid) return;
        $scope.balanceInProgress = true;
        var address = Web3.utils.toChecksumAddress(addressField.$viewValue);
        var enteredAddress = addressField.$viewValue;
        checkBalanceTimer ? $timeout.cancel(checkBalanceTimer) : false;
        checkBalanceTimer = $timeout(function() {
            getEOSAddress(addressField);
            web3.eth.call({
                to: "0x1b22c32cd936cb97c28c5690a0695a82abf688e6",
                data: "0x70a08231000000000000000000000000" + address.split('x')[1]
            }, function(error, response) {
                $scope.balanceInProgress = false;
                if (error || (addressField.$viewValue != enteredAddress)) {
                    $scope.$apply();
                    return
                }
                $scope.checkedEthAddress = Web3.utils.fromWei(new BigNumber(Web3.utils.hexToNumberString(response)).toString(10), 'ether');
                $scope.$apply();
            });
        }, 500);
    };

    $scope.checkAddress = function(addressField) {
        addressField.$setValidity('not-checked', true);
        if (!addressField.$valid) return;
        addressField.$setValidity('not-checked', false);
        if (!addressField.$viewValue) {
            return;
        }
        checkAddressTimeout ? $timeout.cancel(checkAddressTimeout) : false;
        var address = addressField.$viewValue;
        checkAddressTimeout = $timeout(function() {
            EOSService.checkAddress(addressField.$viewValue, 10).then(function(addressInfo) {
                if (address !== addressField.$viewValue) return;
                addressField.$setValidity('not-checked', true);
            });
        }, 200);
    };


}).controller('airdropToolInstruction', function(AIRDROP_TOOL, web3Service, $scope) {

    var isProduction = true || (location.host.indexOf('eos.mywish.io') === 0) || (location.host.indexOf('contracts.mywish.io') > -1);

    $scope.network = isProduction ? 1 : 2;

    var contractAddress = isProduction ? AIRDROP_TOOL.CONTRACT_ADDRESS_MAINNET : AIRDROP_TOOL.CONTRACT_ADDRESS;
    $scope.contractAddress = contractAddress;

    web3Service.setProviderByNumber($scope.network);

    var interfaceMethod = web3Service.getMethodInterface('put', AIRDROP_TOOL.ABI);

    $scope.setAddressSignature = (new Web3()).eth.abi.encodeFunctionCall(
        interfaceMethod, [$scope.ngPopUp.params.eos_address]
    );

    web3Service.getAccounts($scope.network).then(function(result) {
        $scope.currentWallet = result.filter(function(wallet) {
            return wallet.wallet.toLowerCase() === $scope.ngPopUp.params.eth_address.toLowerCase();
        })[0];
    });

    $scope.sendTransaction = function() {
        web3Service.setProvider($scope.currentWallet.type, $scope.network);
        var contract = web3Service.createContractFromAbi(contractAddress, AIRDROP_TOOL.ABI);
        contract.methods.put($scope.ngPopUp.params.eos_address).send({
            from: $scope.currentWallet.wallet
        }, function() {

        });
    };
});
