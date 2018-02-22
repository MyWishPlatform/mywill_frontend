angular.module('app').controller('deferredPreviewController', function($timeout, $rootScope, contractService, openedContract, $scope, exRate, $state) {
    $scope.contract = openedContract.data;
    $scope.setContract($scope.contract);
    $scope.wishCost = new BigNumber($scope.contract.cost).div(Math.pow(10, 18)).round(2).toString(10);

});