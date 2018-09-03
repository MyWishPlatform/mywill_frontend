angular.module('app').controller('eosCrowdSalePreviewController', function($timeout, $rootScope, contractService,
                                                                        openedContract, $scope, $filter) {
    $scope.contract = openedContract.data;


    $scope.setContract($scope.contract);
    $scope.iniEOSContract($scope.contract);

    var contractDetails = $scope.contract.contract_details;

    $scope.contractCrowdsaleInfo = 'eos_contract_crowdsale';
    $scope.contractTokenInfo = 'eos_contract_token';



    $scope.currencyPow = 4;

    if (contractDetails.eth_contract_crowdsale && contractDetails.eth_contract_crowdsale.address) {
        if (contractDetails.whitelist) {
            contractService.getWhiteList($scope.contract.id, {limit: 1}).then(function(response) {
                $scope.whiteListedAddresses = response.data;
            });
        }
    }
    contractDetails.hard_cap_eth = new BigNumber(contractDetails.hard_cap).div(Math.pow(10,$scope.currencyPow)).round(Math.min(2, contractDetails.decimals)).toString(10);
    contractDetails.soft_cap_eth = new BigNumber(contractDetails.soft_cap).div(Math.pow(10,$scope.currencyPow)).round(Math.min(2, contractDetails.decimals)).toString(10);

    contractDetails.hard_cap = new BigNumber(contractDetails.hard_cap).div(Math.pow(10,$scope.currencyPow)).toString(10);
    contractDetails.soft_cap = new BigNumber(contractDetails.soft_cap).div(Math.pow(10,$scope.currencyPow)).toString(10);

    contractDetails.min_wei = contractDetails.min_wei !== null ? new BigNumber(contractDetails.min_wei).div(Math.pow(10,$scope.currencyPow)).toString(10) : undefined;
    contractDetails.max_wei = contractDetails.max_wei !== null ? new BigNumber(contractDetails.max_wei).div(Math.pow(10,$scope.currencyPow)).toString(10) : undefined;


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
        $scope.changeDatesServerError = false;
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
        }).then(function(result) {
            $scope.successChangeDates = result;
        }, function(error) {
            switch(error.code) {
                case 1:
                    $scope.accountNotFinded = true;
                    break;
                case 2:
                    $scope.changeDatesServerError = true;
                    break;
            }
        });
    };


});
