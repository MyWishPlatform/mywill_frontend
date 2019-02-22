angular.module('app').controller('deferredPreviewController', function($timeout, $rootScope, contractService, openedContract, $scope) {
    $scope.contract = openedContract.data;
    $scope.iniContract($scope.contract);
});