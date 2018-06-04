angular.module('app').controller('crowdSalePreviewController', function($timeout, $rootScope, contractService, web3Service,
                                                                        openedContract, $scope, $filter) {
    $scope.contract = openedContract.data;


    $scope.setContract($scope.contract);

    var contractDetails = $scope.contract.contract_details;

    if (contractDetails.eth_contract_crowdsale.address) {
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
        bonus.min_amount = bonus.min_amount ? new BigNumber(bonus.min_amount).times(contractDetails.rate).div(Math.pow(10,18)).round().toString(10) : undefined;
        bonus.max_amount = bonus.max_amount ? new BigNumber(bonus.max_amount).times(contractDetails.rate).div(Math.pow(10,18)).round().toString(10) : undefined;
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


    contractDetails.hard_cap_eth = new BigNumber(contractDetails.hard_cap).div(Math.pow(10,18)).round(Math.min(2, contractDetails.decimals)).toString(10);
    contractDetails.soft_cap_eth = new BigNumber(contractDetails.soft_cap).div(Math.pow(10,18)).round(Math.min(2, contractDetails.decimals)).toString(10);

    contractDetails.hard_cap = new BigNumber(contractDetails.hard_cap).times(contractDetails.rate).div(Math.pow(10,18)).round().toString(10);
    contractDetails.soft_cap = new BigNumber(contractDetails.soft_cap).times(contractDetails.rate).div(Math.pow(10,18)).round().toString(10);

    contractDetails.min_wei = contractDetails.min_wei !== null ? contractDetails.min_wei : undefined;
    contractDetails.max_wei = contractDetails.max_wei !== null ? contractDetails.max_wei : undefined;

    $scope.timeBonusChartParams = {
        max_time: contractDetails.stop_date,
        min_time: contractDetails.start_date,
        max_amount: contractDetails.hard_cap,
        min_amount: 0
    };

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
        address: $filter('translate')('CONTRACTS.FOR_SALE')
    });

}).controller('changeDateController', function($scope, $timeout, APP_CONSTANTS, web3Service, $filter) {

    var contract = angular.copy($scope.ngPopUp.params.contract);
    $scope.contract = contract;
    $scope.date_type = false;

    $scope.newDatesFields = {
        start_date: contract.contract_details.start_date,
        stop_date: contract.contract_details.stop_date
    };

    $scope.validationDates = {
        minForFinish: $scope.newDatesFields.start_date + 300,
        maxForStart: $scope.newDatesFields.stop_date - 300
    };

    /* Управление датой и временем начала/окончания ICO (begin) */
    var setStartTimestamp = function() {
        if (!$scope.dates.startDate) {
            $scope.dates.startDate = moment($scope.newDatesFields.start_date * 1000);
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
            $scope.dates.endDate = moment($scope.newDatesFields.stop_date * 1000);
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


    $scope.minStartDate = moment().add(5, 'minutes').second(0);
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



    $scope.generateSignature = function() {
        // var mintInterfaceMethod = web3Service.getMethodInterface(
        //     !$scope.recipient.isFrozen ? 'mint' : 'mintAndFreeze',
        //     contract.contract_details.eth_contract_token.abi);
        // var powerNumber = new BigNumber('10').toPower(contract.contract_details.decimals || 0);
        // var amount = new BigNumber($scope.recipient.amount).times(powerNumber).toString(10);
        //
        // var params = [$scope.recipient.address, amount];
        //
        // if ($scope.recipient.isFrozen) {
        //     params.push($scope.recipient.freeze_date.format('X'));
        // }
        // $scope.mintSignature.string = (new Web3()).eth.abi.encodeFunctionCall(
        //     mintInterfaceMethod, params
        // );
    };

    $scope.successCodeCopy = function(contract, field) {
        contract.copied = contract.copied || {};
        contract.copied[field] = true;
        $timeout(function() {
            contract.copied[field] = false;
        }, 1000);
    };

    // $scope.sendMintTransaction = function() {
    //     var powerNumber = new BigNumber('10').toPower(contract.contract_details.decimals || 0);
    //     var amount = new BigNumber($scope.recipient.amount).times(powerNumber).toString(10);
    //
    //     if ($scope.recipient.isFrozen) {
    //         web3Contract.methods.mintAndFreeze(
    //             $scope.recipient.address,
    //             amount,
    //             $scope.recipient.freeze_date.format('X')
    //         ).send({
    //             from: $scope.currentWallet.wallet
    //         }).then(console.log);
    //     } else {
    //         web3Contract.methods.mint($scope.recipient.address, amount).send({
    //             from: $scope.currentWallet.wallet
    //         }).then(console.log);
    //     }
    // };

});
