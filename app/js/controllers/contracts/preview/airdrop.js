angular.module('app').controller('airdropPreviewController', function($timeout, $rootScope, contractService, openedContract, $scope) {
    $scope.contract = openedContract.data;
    $scope.setContract($scope.contract);
});
