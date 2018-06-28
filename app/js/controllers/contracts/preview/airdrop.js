angular.module('app').controller('airdropPreviewController', function($timeout, web3Service, openedContract, $scope, $rootScope) {
    $scope.contract = openedContract.data;
    $scope.setContract($scope.contract);

    web3Service.setProviderByNumber($scope.contract.network);

    console.log($scope.contract.contract_details.eth_contract.abi);

    var contractAddress = $rootScope.web3Utils.toChecksumAddress($scope.contract.contract_details.eth_contract.address);

    var web3Contract = web3Service.createContractFromAbi($scope.contract.contract_details.token_address, window.abi);

    var tokenInfoFields = ['decimals', 'symbol'];
    $scope.tokenInfo = {};
    var requestsCount = 0;

    web3Contract.methods.balanceOf(contractAddress).call(function(err, balance) {
        tokenInfoFields.map(function(method) {
            web3Contract.methods[method]().call(function(err, result) {
                requestsCount++;
                $scope.tokenInfo[method] = result;
                if (requestsCount === tokenInfoFields.length) {
                    $scope.tokenInfo.balance = new BigNumber(balance).div(Math.pow(10, $scope.tokenInfo.decimals)).toString(10);
                    $scope.$apply();
                }
            });
        });
    });


});
