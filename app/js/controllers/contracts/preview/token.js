angular.module('app').controller('tokenPreviewController', function($timeout, $rootScope, contractService, openedContract, $scope, exRate, $state) {
    $scope.contract = openedContract.data;
    $scope.$parent.wishCost = exRate.data.WISH / 2;
    $scope.contract.cost = new BigNumber($scope.$parent.wishCost).times(Math.pow(10, 18)).toString(10);
    $scope.setContract($scope.contract);
    var contractDetails = $scope.contract.contract_details;

    var powerNumber = new BigNumber('10').toPower(contractDetails.decimals || 0);
    contractDetails.token_holders.map(function(holder) {
        holder.amount = new BigNumber(holder.amount).div(powerNumber).toString(10);
    });

    var holdersSum = contractDetails.token_holders.reduce(function (val, item) {
        var value = new BigNumber(item.amount || 0);
        return value.plus(val);
    }, new BigNumber(0));

    $scope.totalSupply = {
        tokens: holdersSum
    };

    $scope.chartOptions = {
        itemValue: 'amount',
        itemLabel: 'address'
    };
    $scope.chartData = angular.copy(contractDetails.token_holders);
});