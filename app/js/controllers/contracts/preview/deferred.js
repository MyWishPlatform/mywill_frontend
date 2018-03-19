angular.module('app').controller('deferredPreviewController', function($timeout, $rootScope, contractService, openedContract, $scope, exRate, $state) {
    $scope.contract = openedContract.data;
    $scope.setContract($scope.contract);
});