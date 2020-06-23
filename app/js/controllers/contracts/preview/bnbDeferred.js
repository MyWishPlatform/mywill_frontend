angular.module('app').controller('bnbDeferredPreviewController', function($timeout, $rootScope, contractService, openedContract, $scope) {
    $scope.contract = openedContract.data;
    $scope.iniContract($scope.contract);
});