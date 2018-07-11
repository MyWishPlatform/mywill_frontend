angular.module('app').controller('investmentPullPreviewController', function($timeout, $rootScope, contractService,
                                                                             openedContract, $scope, web3Service) {
    $scope.contract = openedContract.data;
    $scope.details = $scope.contract.contract_details;

    $scope.details.hard_cap = $rootScope.web3Utils.fromWei($scope.details.hard_cap, 'ether');
    $scope.details.soft_cap = $rootScope.web3Utils.fromWei($scope.details.soft_cap, 'ether');

    $scope.details.min_wei = $scope.details.min_wei ? $rootScope.web3Utils.fromWei($scope.details.min_wei, 'ether') : false;
    $scope.details.max_wei = $scope.details.max_wei ? $rootScope.web3Utils.fromWei($scope.details.max_wei, 'ether') : false;

    $scope.setContract($scope.contract);

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

});