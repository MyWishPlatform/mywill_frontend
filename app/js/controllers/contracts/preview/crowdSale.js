angular.module('app').controller('crowdSalePreviewController', function($timeout, $rootScope, contractService, openedContract, $scope, exRate, CONTRACT_STATUSES_CONSTANTS, $state) {
    $scope.contract = openedContract.data;
    $scope.setContract($scope.contract);


    $scope.statuses = CONTRACT_STATUSES_CONSTANTS;

    var contractDetails = $scope.contract.contract_details;

    contractDetails.hard_cap_eth = new BigNumber(contractDetails.hard_cap).div(Math.pow(10,18)).round(Math.min(2, contractDetails.decimals)).toString(10);
    contractDetails.soft_cap_eth = new BigNumber(contractDetails.soft_cap).div(Math.pow(10,18)).round(Math.min(2, contractDetails.decimals)).toString(10);

    contractDetails.hard_cap = new BigNumber(contractDetails.hard_cap).times(contractDetails.rate).div(Math.pow(10,18)).round().toString(10);
    contractDetails.soft_cap = new BigNumber(contractDetails.soft_cap).times(contractDetails.rate).div(Math.pow(10,18)).round().toString(10);
    contractDetails.time_bonuses = contractDetails.time_bonuses || [];
    contractDetails.time_bonuses.map(function(bonus) {
        bonus.min_amount = bonus.min_amount ? new BigNumber(bonus.min_amount).times(contractDetails.rate).div(Math.pow(10,18)).round().toString(10) : undefined;
        bonus.max_amount = bonus.max_amount ? new BigNumber(bonus.max_amount).times(contractDetails.rate).div(Math.pow(10,18)).round().toString(10) : undefined;
        bonus.min_time = bonus.min_time ? bonus.min_time * 1000 : undefined;
        bonus.max_time = bonus.max_time ? bonus.max_time * 1000 : undefined;
    });
    contractDetails.amount_bonuses = contractDetails.amount_bonuses || [];
    contractDetails.amount_bonuses.map(function(bonus) {
        bonus.min_amount = new BigNumber(bonus.min_amount).div(Math.pow(10,18)).round().toString(10);
        bonus.max_amount = new BigNumber(bonus.max_amount).div(Math.pow(10,18)).round().toString(10);
    });

    contractDetails.sources = {
        crowdsale: contractDetails.eth_contract_crowdsale.source_code || false,
        token: contractDetails.eth_contract_token.source_code || false
    };

    var powerNumber = new BigNumber('10').toPower(contractDetails.decimals || 0);
    contractDetails.token_holders.map(function(holder) {
        holder.amount = new BigNumber(holder.amount).div(powerNumber).toString(10);
    });

    var holdersSum = contractDetails.token_holders.reduce(function (val, item) {
        var value = new BigNumber(item.amount || 0);
        return value.plus(val);
    }, new BigNumber(0));

    var ethSum = holdersSum.plus(contractDetails.hard_cap);
    $scope.totalSupply = {
        eth: ethSum.div(contractDetails.rate).round(2).toString(10),
        tokens: ethSum.round(2).toString(10)
    };


    $scope.chartOptions = {
        itemValue: 'amount',
        itemLabel: 'address'
    };
    $scope.chartData = angular.copy(contractDetails.token_holders);
    $scope.chartData.unshift({
        amount: contractDetails.hard_cap,
        address: 'For Sale'
    });

    $scope.stateValue = $scope.statuses[$scope.contract.state]['value'];
    $scope.stateTitle = $scope.statuses[$scope.contract.state]['title'];

    $scope.wishCost = exRate.data.WISH;
});
