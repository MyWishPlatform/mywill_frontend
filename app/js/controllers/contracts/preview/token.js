angular.module('app').controller('tokenPreviewController', function($timeout, $rootScope, contractService, openedContract, $scope, exRate, $state) {
    $scope.contract = openedContract.data;
    $scope.$parent.wishCost = exRate.data.WISH;
    $scope.setContract($scope.contract);
    var contractDetails = $scope.contract.contract_details;

    var powerNumber = new BigNumber('10').toPower(contractDetails.decimals || 0);
    contractDetails.token_holders.map(function(holder) {
        holder.amount = new BigNumber(holder.amount).div(powerNumber).toString(10);
    });

    $scope.chartOptions = {
        itemValue: 'amount',
        itemLabel: 'address'
    };
    $scope.chartData = angular.copy(contractDetails.token_holders);
});