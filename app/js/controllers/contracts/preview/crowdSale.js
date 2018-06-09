angular.module('app').controller('crowdSalePreviewController', function($timeout, $rootScope, contractService, web3Service,
                                                                        openedContract, $scope, $filter) {
    $scope.contract = openedContract.data;


    $scope.setContract($scope.contract);

    var contractDetails = $scope.contract.contract_details;


    switch ($scope.contract.network) {
        case 1:
        case 2:
            $scope.blockchain = 'ETH';
            $scope.contractCrowdsaleInfo = 'eth_contract_crowdsale';
            $scope.contractTokenInfo = 'eth_contract_token';
            break;
        case 5:
        case 6:
            $scope.blockchain = 'NEO';
            $scope.contractCrowdsaleInfo = 'neo_contract_crowdsale';
            $scope.contractTokenInfo = 'neo_contract_token';
            break;
    }

    $scope.currencyPow = $scope.blockchain === 'NEO' ? 0 : 18;

    if (contractDetails.eth_contract_crowdsale && contractDetails.eth_contract_crowdsale.address) {
        web3Service.setProvider('infura');
        var contract = web3Service.createContractFromAbi(contractDetails.eth_contract_crowdsale.address, contractDetails.eth_contract_crowdsale.abi);
        if (typeof contract.methods.vault === 'function') {
            contract.methods.vault().call(function(error, result) {
                if (error) return;
                contractDetails.eth_contract_crowdsale.vault = result;
                $scope.$apply();
            });
        }
    }

    contractDetails.time_bonuses = contractDetails.time_bonuses || [];
    contractDetails.time_bonuses.map(function(bonus) {
        bonus.min_amount = bonus.min_amount ? new BigNumber(bonus.min_amount).times(contractDetails.rate).div(Math.pow(10,$scope.currencyPow)).round().toString(10) : undefined;
        bonus.max_amount = bonus.max_amount ? new BigNumber(bonus.max_amount).times(contractDetails.rate).div(Math.pow(10,$scope.currencyPow)).round().toString(10) : undefined;
        bonus.min_time = bonus.min_time ? bonus.min_time * 1000 : undefined;
        bonus.max_time = bonus.max_time ? bonus.max_time * 1000 : undefined;
    });

    var bonuses = angular.copy(contractDetails.time_bonuses || []);
    $scope.timeBonusChartData = [];

    bonuses.map(function(currBonus, index) {
        currBonus.isTimesAmount = currBonus.min_time && currBonus.min_time;
        currBonus.isTokensAmount = currBonus.min_amount && currBonus.max_amount;
        var bonus = {
            bonus: currBonus.bonus,
            min_amount: currBonus.min_amount,
            max_amount: currBonus.max_amount,
            min_time: currBonus.min_time,
            max_time: currBonus.max_time
        };
        var indexOfTimeBonus = bonuses.indexOf(currBonus);
        var prevTimeBonuses = bonuses.filter(function(bon, index) {
            return (index < indexOfTimeBonus) && bon.isTimesAmount;
        });
        var prevTimeBonus = prevTimeBonuses[prevTimeBonuses.length - 1];
        var prevTokenBonuses = bonuses.filter(function(bon, index) {
            return (index < indexOfTimeBonus) && bon.isTokensAmount;
        });
        var prevTokenBonus = prevTokenBonuses[prevTokenBonuses.length - 1];
        var prevOnlyTimeBonuses = bonuses.filter(function(bon, index) {
            return (index < indexOfTimeBonus) && bon.isTimesAmount && !bon.isTokensAmount;
        });
        var prevOnlyTimeBonus = prevOnlyTimeBonuses[prevOnlyTimeBonuses.length - 1];

        var prevOnlyTokenBonuses = bonuses.filter(function(bon, index) {
            return (index < indexOfTimeBonus) && bon.isTokensAmount && !bon.isTimesAmount;
        });
        var prevOnlyTokenBonus = prevOnlyTokenBonuses[prevOnlyTokenBonuses.length - 1];
        if (!currBonus.isTimesAmount) {
            // bonus.min_time = prevTimeBonus ? prevTimeBonus.max_time : false;
            // bonus.max_time = false;
        }
        if (prevOnlyTimeBonus !== prevTimeBonus) {
            bonus.prev_min_time = prevOnlyTimeBonus ? prevOnlyTimeBonus.max_time : false;
        } else {
            bonus.prev_min_time = bonus.min_time;
        }
        if (!currBonus.isTokensAmount) {
            // bonus.min_amount = prevTokenBonus ? prevTokenBonus.max_amount : false;
            // bonus.max_amount = false;
        }
        if (prevOnlyTokenBonus !== prevTokenBonus) {
            bonus.prev_min_amount = prevOnlyTokenBonus ? prevOnlyTokenBonus.max_amount : false;
        } else {
            bonus.prev_min_amount = bonus.min_amount;
        }
        $scope.timeBonusChartData.push(bonus);
    });

    var amountBonuses = angular.copy(contractDetails.amount_bonuses || []);
    $scope.amountBonusChartData = [];
    amountBonuses.map(function(item) {
        var chartItem = {
            valueY: item.bonus,
            maxValueX: item.max_amount,
            minValueX: item.min_amount
        };
        $scope.amountBonusChartData.push(chartItem);
    });

    if ($scope.blockchain === 'ETH') {
        contractDetails.hard_cap_eth = new BigNumber(contractDetails.hard_cap).div(Math.pow(10,$scope.currencyPow)).round(Math.min(2, contractDetails.decimals)).toString(10);
        contractDetails.soft_cap_eth = new BigNumber(contractDetails.soft_cap).div(Math.pow(10,$scope.currencyPow)).round(Math.min(2, contractDetails.decimals)).toString(10);

        contractDetails.hard_cap = new BigNumber(contractDetails.hard_cap).times(contractDetails.rate).div(Math.pow(10,$scope.currencyPow)).round().toString(10);
        contractDetails.soft_cap = new BigNumber(contractDetails.soft_cap).times(contractDetails.rate).div(Math.pow(10,$scope.currencyPow)).round().toString(10);

        contractDetails.min_wei = contractDetails.min_wei !== null ? contractDetails.min_wei : undefined;
        contractDetails.max_wei = contractDetails.max_wei !== null ? contractDetails.max_wei : undefined;
    }
    if ($scope.blockchain === 'NEO') {
        contractDetails.hard_cap_eth = new BigNumber(contractDetails.hard_cap).round(Math.min(2, contractDetails.decimals)).toString(10);
        contractDetails.hard_cap = new BigNumber(contractDetails.hard_cap).times(contractDetails.rate).round().toString(10);
    }
    $scope.timeBonusChartParams = {
        max_time: contractDetails.stop_date,
        min_time: contractDetails.start_date,
        max_amount: contractDetails.hard_cap,
        min_amount: 0
    };

    contractDetails.amount_bonuses = contractDetails.amount_bonuses || [];
    contractDetails.amount_bonuses.map(function(bonus) {
        bonus.min_amount = new BigNumber(bonus.min_amount).div(Math.pow(10,$scope.currencyPow)).round().toString(10);
        bonus.max_amount = new BigNumber(bonus.max_amount).div(Math.pow(10,$scope.currencyPow)).round().toString(10);
    });

    if (contractDetails.eth_contract_crowdsale) {
        contractDetails.sources = {
            crowdsale: contractDetails.eth_contract_crowdsale.source_code || false,
            token: contractDetails.eth_contract_token.source_code || false
        };
    }

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

}).controller('changeDateFormController', function($scope, $timeout, APP_CONSTANTS, web3Service, $filter) {

    var contract = angular.copy($scope.ngPopUp.params.contract);
    $scope.contract = contract;
    $scope.date_type = false;

    $scope.newDatesFields = {
        start_date: contract.contract_details.start_date,
        stop_date: contract.contract_details.stop_date
    };

    $scope.minStartDate = moment().add(5, 'minutes').second(0);

    var currentStartDate = $scope.newDatesFields.start_date + 300;

    var minForFinish = Math.max(currentStartDate, $scope.minStartDate.format('X')*1);

    $scope.validationDates = {
        minForFinish: minForFinish,
        minForStart: contract.contract_details.start_date,
        maxForStart: $scope.newDatesFields.stop_date - 300
    };

    $scope.startDateIsEnable = !contract.contract_details.time_bonuses.length && (contract.contract_details.start_date >= $scope.minStartDate.format('X') * 1);
    $scope.endDateIsEnable = contract.contract_details.stop_date >= $scope.minStartDate.format('X') * 1;

    /* Управление датой и временем начала/окончания ICO (begin) */
    var setStartTimestamp = function() {
        if (!$scope.dates.startDate) {
            $scope.dates.startDate = moment($scope.request.start_date * 1000);
        }
        $scope.dates.startDate.hours($scope.timesForStarting.start.hours).minutes($scope.timesForStarting.start.minutes);
        if ($scope.dates.startDate < $scope.minStartDate) {
            $scope.dates.startDate = $scope.minStartDate.clone();
        }

        $timeout(function() {
            $scope.newDatesFields.start_date = $scope.dates.startDate.clone().hours($scope.timesForStarting.start.hours).minutes($scope.timesForStarting.start.minutes).format('X') * 1;
        });
    };
    var setStopTimestamp = function() {
        if (!$scope.dates.endDate) {
            $scope.dates.endDate = moment($scope.request.stop_date * 1000);
        }
        $scope.dates.endDate.hours($scope.timesForStarting.stop.hours).minutes($scope.timesForStarting.stop.minutes);
        if ($scope.dates.endDate < $scope.minStartDate) {
            $scope.dates.endDate = $scope.minStartDate.clone();
        }
        $timeout(function() {
            $scope.newDatesFields.stop_date = $scope.dates.endDate.clone().hours($scope.timesForStarting.stop.hours).minutes($scope.timesForStarting.stop.minutes).format('X') * 1;
        });
    };



    $scope.onChangeStartTime = setStartTimestamp;
    $scope.onChangeStopTime = setStopTimestamp;
    $scope.onChangeStartDate = setStartTimestamp;
    $scope.onChangeEndDate = setStopTimestamp;


    $scope.dates = {
        startDate: moment($scope.newDatesFields.start_date * 1000),
        endDate: moment($scope.newDatesFields.stop_date * 1000)
    };
    $scope.timesForStarting = {
        start: {
            hours: $scope.dates.startDate.hours(),
            minutes: $scope.dates.startDate.minutes()
        },
        stop: {
            hours: $scope.dates.endDate.hours(),
            minutes: $scope.dates.endDate.minutes()
        }
    };
}).controller('changeDateController', function($scope, web3Service) {

    var contractData = $scope.ngPopUp.params.contract;

    $scope.contract = contractData;
    web3Service.setProviderByNumber(contractData.network);

    var contractDetails = contractData.contract_details, contract;
    var params = [];

    var startDate = $scope.ngPopUp.params.dates.startDate.format('X'),
        endDate = $scope.ngPopUp.params.dates.endDate.format('X');

    var startDateIdent = startDate == contractDetails.start_date;
    var endDateIdent = endDate == contractDetails.stop_date;

    if (!startDateIdent) {
        params.push(startDate);
    }
    if (!endDateIdent) {
        params.push(endDate);
    }
    var methodName = (!startDateIdent && !endDateIdent) ? 'setTimes' : (!startDateIdent ? 'setStartTime' : 'setEndTime');

    var interfaceMethod = web3Service.getMethodInterface(methodName, contractDetails.eth_contract_crowdsale.abi);
    $scope.changeDateSignature = (new Web3()).eth.abi.encodeFunctionCall(interfaceMethod, params);
    web3Service.getAccounts(contractData.network).then(function(result) {
        $scope.currentWallet = result.filter(function(wallet) {
            return wallet.wallet.toLowerCase() === contractDetails.admin_address.toLowerCase();
        })[0];
        if ($scope.currentWallet) {
            web3Service.setProvider($scope.currentWallet.type, contractData.network);
            contract = web3Service.createContractFromAbi(contractDetails.eth_contract_crowdsale.address, contractDetails.eth_contract_crowdsale.abi);
        }
    });

    $scope.sendTransaction = function() {
        if (params.length === 2) {
            contract.methods[methodName](params[0], params[1]).send({
                from: $scope.currentWallet.wallet
            }).then(console.log);
        }
        if (params.length === 1) {
            contract.methods[methodName](params[0]).send({
                from: $scope.currentWallet.wallet
            }).then(console.log);
        }

    };
});
