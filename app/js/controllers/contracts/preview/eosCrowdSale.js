angular.module('app').controller('eosCrowdSalePreviewController', function($timeout, $rootScope, contractService,
                                                                        openedContract, $scope, $filter) {

    $scope.contract = openedContract.data;
    $scope.iniContract($scope.contract, true);

    var contractDetails = $scope.contract.contract_details;

    $scope.contractCrowdsaleInfo = 'eos_contract_crowdsale';

    var currencyPow = Math.pow(10, 4);
    var decimalsValue = Math.pow(10, contractDetails.decimals);

    contractDetails.hard_cap = contractDetails.hard_cap / decimalsValue;
    contractDetails.soft_cap = contractDetails.soft_cap / decimalsValue;

    contractDetails.min_wei = contractDetails.min_wei !== null ? contractDetails.min_wei / currencyPow : undefined;
    contractDetails.max_wei = contractDetails.max_wei !== null ? contractDetails.max_wei / currencyPow : undefined;

    var holdersSum = contractDetails.token_holders.reduce(function (val, item) {
        item.amount = item.amount / decimalsValue;
        return item.amount + val;
    }, 0);

    var ethSum = holdersSum + contractDetails.hard_cap;

    $scope.totalSupply = {
        tokens: ethSum
    };

    $scope.chartOptions = {
        itemValue: 'amount',
        itemLabel: 'address'
    };
    $scope.chartData = angular.copy(contractDetails.token_holders);
    $scope.chartData.unshift({
        amount: contractDetails.hard_cap,
        address: $filter('translate')('CONTRACTS.FOR_SALE')
    });

}).controller('eosChangeDateController', function($scope, EOSService) {

    EOSService.createEosChain($scope.contract.network);

    var actions = [];

    var contractDetails = $scope.contract.contract_details;

    var createTxData = function() {
        var startDate = $scope.dates.startDate.format('X'),
            endDate = $scope.dates.endDate.format('X');

        if (startDate != contractDetails.start_date) {
            actions.push({
                account: contractDetails.crowdsale_address,
                name: 'setstart',
                data: {
                    'start': startDate * 1
                }
            });
        }

        if (endDate != contractDetails.stop_date) {
            actions.push({
                account: contractDetails.crowdsale_address,
                name: 'setfinish',
                data: {
                    'finish': endDate * 1
                }
            });
        }
    };

    $scope.scatterNotInstalled = false;
    $scope.closeScatterAlert = function() {
        $scope.scatterNotInstalled = false;
        $scope.accountNotFinded = false;
        $scope.txServerError = false;
    };

    $scope.generateScatterTx = function() {

        $scope.scatterNotInstalled = !EOSService.checkScatter();
        if ($scope.scatterNotInstalled) return;
        actions = [];
        createTxData();

        if (!actions.length) return;

        EOSService.sendTx({
            actions: actions,
            owner: $scope.contract.contract_details.admin_address
        }, $scope.contract.network).then(function(result) {
            $scope.successTx = result;
        }, function(error) {
            switch(error.code) {
                case 1:
                    $scope.accountNotFinded = true;
                    break;
                case 2:
                    $scope.txServerError = true;
                    break;
            }
        });
    };
}).controller('eosWithdrawController', function($scope, EOSService) {

    $scope.scatterNotInstalled = false;
    $scope.closeScatterAlert = function() {
        $scope.scatterNotInstalled = false;
        $scope.accountNotFinded = false;
        $scope.txServerError = false;
    };

    $scope.generateWithdrawTx = function() {
        $scope.scatterNotInstalled = !EOSService.checkScatter();
        if ($scope.scatterNotInstalled) return;

        EOSService.sendTx({
            actions: [{
                account: $scope.contract.contract_details.crowdsale_address,
                name: 'withdraw',
                data: {}
            }],
            owner: $scope.contract.contract_details.admin_address
        }, $scope.contract.network).then(function(result) {
            $scope.successTx = result;
        }, function(error) {
            switch(error.code) {
                case 1:
                    $scope.accountNotFinded = true;
                    break;
                case 2:
                    $scope.txServerError = true;
                    break;
            }
        });
    };
}).controller('eosFinalizeController', function($scope, EOSService) {

    $scope.scatterNotInstalled = false;
    $scope.closeScatterAlert = function() {
        $scope.scatterNotInstalled = false;
        $scope.accountNotFinded = false;
        $scope.txServerError = false;
    };

    $scope.generateFinalizeTx = function() {
        $scope.scatterNotInstalled = !EOSService.checkScatter();
        if ($scope.scatterNotInstalled) return;

        EOSService.sendTx({
            actions: [{
                account: $scope.contract.contract_details.crowdsale_address,
                name: 'finalize',
                data: {}
            }]
            // owner: $scope.contract.contract_details.admin_address
        }, $scope.contract.network).then(function(result) {
            $scope.successTx = result;
        }, function(error) {
            switch(error.code) {
                case 1:
                    $scope.accountNotFinded = true;
                    break;
                case 2:
                    $scope.txServerError = true;
                    break;
            }
        });
    };
});
