angular.module('app').controller('deferredPreviewController', function($timeout, $rootScope, contractService, openedContract, $scope, exRate, CONTRACT_STATUSES_CONSTANTS, $state) {
    $scope.contract = openedContract.data;
    $scope.statuses = CONTRACT_STATUSES_CONSTANTS;
    $scope.setContract($scope.contract);
    var contractDetails = $scope.contract.contract_details;

    $scope.wishCost = new BigNumber($scope.contract.cost).div(Math.pow(10, 18)).round(2).toString(10);

    $scope.stateValue = $scope.statuses[$scope.contract.state]['value'];
    $scope.stateTitle = $scope.statuses[$scope.contract.state]['title'];

});