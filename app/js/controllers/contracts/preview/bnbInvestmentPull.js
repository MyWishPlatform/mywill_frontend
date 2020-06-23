angular.module('app').controller('bnbInvestmentPullPreviewController', function($timeout, $rootScope, contractService, $state,
                                                                             openedContract, $scope, web3Service, $window) {
    $scope.contract = openedContract.data;
    $scope.details = $scope.contract.contract_details;

    $scope.details.hard_cap_eth = $rootScope.web3Utils.fromWei($scope.details.hard_cap, 'ether');
    $scope.details.soft_cap_eth = $rootScope.web3Utils.fromWei($scope.details.soft_cap, 'ether');

    $scope.details.min_wei = $scope.details.min_wei ? $rootScope.web3Utils.fromWei($scope.details.min_wei, 'ether') : false;
    $scope.details.max_wei = $scope.details.max_wei ? $rootScope.web3Utils.fromWei($scope.details.max_wei, 'ether') : false;

    $scope.iniContract($scope.contract);

    if ($scope.contract.contract_details.token_address) {
        var infoData = ['decimals', 'symbol'];
        if ($scope.contract.stateValue === 11) {
            infoData.push('balanceOf');
        }

        web3Service.getTokenInfo(
            $scope.contract.network,
            $scope.contract.contract_details.token_address,
            $scope.contract.contract_details.eth_contract.address,
            infoData
        ).then(function(result) {
            $scope.tokenInfo = result;
            if (result.balance * 1) {
                $scope.contract.balance = result.balance;
            }
        });
    }

    if ((($scope.contract.stateValue == 4) || ($scope.contract.stateValue == 11)) && $scope.details.whitelist) {
        contractService.getWhiteList($scope.contract.id, {limit: 1}).then(function(response) {
            $scope.whiteListedAddresses = response.data;
        });
    }

    $scope.contractUrl = $scope.details.link ?
        $window.location.origin + $state.href('main.contracts.preview.public', {key: $scope.details.link}) : false;

});
