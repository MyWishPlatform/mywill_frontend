angular.module('app').controller('joinAirdropController', function($scope, $timeout, EOSService) {

    var checkAddressTimeout;

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

    $scope.contractAddress = AIRDROP_TOOL.CONTRACT_ADDRESS;

    var isProduction = (location.host.indexOf('eos.mywish.io') === 0) || (location.host.indexOf('contracts.mywish.io') > -1);
    $scope.network = isProduction ? 1 : 2;

    web3Service.setProviderByNumber($scope.network);
    var contract = web3Service.createContractFromAbi(AIRDROP_TOOL.CONTRACT_ADDRESS, AIRDROP_TOOL.ABI);

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
        contract.methods['put']($scope.ngPopUp.params.eos_address).send({
            from: $scope.currentWallet.wallet
        }).then(console.log);
    };
});
