angular.module('app').controller('eosWalletPreviewController', function($timeout, openedContract, $scope) {
    $scope.contract = openedContract.data;
    $scope.iniContract($scope.contract);
});
