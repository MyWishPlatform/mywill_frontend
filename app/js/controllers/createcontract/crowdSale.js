angular.module('app').controller('crowdSaleCreateController', function(exRate, $scope, currencyRate, contractService,
                                                                       openedContract,
                                                                       $timeout, $state, $rootScope, CONTRACT_TYPES_CONSTANTS) {

    $scope.wishCost = new BigNumber(exRate.data.WISH).round(2).toString(10);
    $scope.currencyRate = currencyRate.data;

    var contract = openedContract && openedContract.data ? openedContract.data : {
        name:  'MyCrowdSale' + ($rootScope.currentUser.contracts + 1),
        contract_details: {
            token_holders: [],
            amount_bonuses: [],
            tokens_bonuses: []
        }
    };

    /* Управление датой и временем начала/окончания ICO (begin) */
    var setStartTimestamp = function() {
        var date = $scope.dates.startDate.clone();
        date.hours($scope.startTime.hours).minutes($scope.startTime.minutes).second(0);
        $scope.request.start_date = date.format('X') * 1;
        $scope.dates.startDate = date;
    };
    var setStopTimestamp = function() {
        var date = $scope.dates.endDate.clone();
        date.hours($scope.endTime.hours).minutes($scope.endTime.minutes).second(0);
        $scope.request.stop_date = date.format('X') * 1;
        $scope.dates.endDate = date;
    };
    $scope.onChangeStartTime = setStartTimestamp;
    $scope.onChangeStopTime = setStopTimestamp;
    $scope.onChangeStartDate = function(modelName, currentDate) {
        $scope.dates.startDate = currentDate.clone();
        setStartTimestamp();
    };
    $scope.onChangeEndDate = function(modelName, currentDate) {
        $scope.dates.endDate = currentDate.clone();
        setStopTimestamp();
    };
    /* Управление датой и временем начала/окончания ICO (end) */

    /* Управление получателями токенов после окончания ICO (begin) */
    $scope.addRecipient = function() {
        var holder = {
            freeze_date: $scope.dates.endDate.clone()
        };
        $scope.request.token_holders.push(holder);
        $scope.onChangeDateOfRecipient('', holder.freeze_date);
    };
    $scope.removeRecipient = function(recipient) {
        $scope.request.token_holders = $scope.request.token_holders.filter(function(rec) {
            return rec !== recipient;
        });
    };
    $scope.checkTokensAmount = function() {
        var holdersSum = $scope.request.token_holders.reduce(function (val, item) {
            var value = new BigNumber(item.amount || 0);
            return value.plus(val);
        }, new BigNumber(0));

        var stringValue = holdersSum.toString(10);
        $scope.tokensAmountError = isNaN($scope.request.hard_cap) || (isNaN(stringValue) && $scope.request.token_holders.length);
        if (!$scope.tokensAmountError) {
            var ethSum = holdersSum.plus($scope.request.hard_cap);
            $scope.totalSupply = {
                eth: ethSum.div($scope.request.rate).round(2).toString(10),
                tokens: ethSum.round(2).toString(10)
            };
            $timeout(function() {
                $scope.dataChanged();
                $scope.$apply();
            });
        }
    };
    $scope.chartOptions = {
        itemValue: 'amount',
        itemLabel: 'address'
    };
    $scope.chartData = [];
    $scope.dataChanged = function() {
        $scope.chartData = angular.copy($scope.request.token_holders);
        $scope.chartData.unshift({
            amount: $scope.request.hard_cap,
            address: 'For Sale'
        });
        $scope.chartOptions.updater ? $scope.chartOptions.updater() : false;
    };
    $scope.onChangeDateOfRecipient = function(path, value) {
        $scope.request.token_holders.filter(function(holder) {
            return holder.freeze_date === value;
        })[0]['parsed_freeze_date'] = value.format('X') * 1;
    };
    /* Управление получателями токенов после окончания ICO (end) */

    /* Управление бонусами (begin) */
    $scope.addAmountBonus = function() {
        $scope.request.amount_bonuses.push({});
    };
    $scope.deleteAmountBonus = function(bonus) {
        $scope.request.amount_bonuses = $scope.request.amount_bonuses.filter(function(bns) {
            return bns != bonus;
        });
        $scope.createAmountBonusChartData();
    };
    $scope.addTokenBonus = function() {
        var bonuses = $scope.request.tokens_bonuses;
        var lastBonus = bonuses[bonuses.length - 1];

        var newBonus = !lastBonus ? {
            date_from: $scope.dates.startDate.clone()
        } : {
            date_from: lastBonus.date_to.clone()
        };
        newBonus.date_to = $scope.dates.endDate.clone();
        newBonus.time_from = {hours: newBonus.date_from.hours(), minutes: newBonus.date_from.minutes()};
        newBonus.time_to = {hours: newBonus.date_to.hours(), minutes: newBonus.date_to.minutes()};
        bonuses.push(newBonus);
    };
    $scope.deleteTokenBonus = function(bonus) {
        $scope.request.tokens_bonuses = $scope.request.tokens_bonuses.filter(function(bns) {
            return bns != bonus;
        });
    };
    $scope.createAmountBonusChartData = function() {
        $scope.amountBonusChartData = [];
        if (!$scope.request.amount_bonuses.length) return;
        var firstBonus = $scope.request.amount_bonuses[0];
        var lastBonus = $scope.request.amount_bonuses[$scope.request.amount_bonuses.length - 1];
        if (isNaN(lastBonus.max_amount) || isNaN(firstBonus.min_amount)) return;
        $scope.request.amount_bonuses.map(function(item) {
            var chartItem = {
                valueY: item.percentage,
                maxValueX: item.max_amount,
                minValueX: item.min_amount
            };
            $scope.amountBonusChartData.push(chartItem);
        });
    };

    $scope.onChangeBonusDate = function(path, value, model) {

        if (path === 'bonus.date_from') {
            var bonus = $scope.request.tokens_bonuses.filter(function(bonus) {
                return bonus.date_from === value;
            })[0];
            bonus.date_from = value.clone();
            $scope.onChangeBonusTime({field: 'time_from', model: bonus});
        }

        if (path === 'bonus.date_to') {
            var bonus = $scope.request.tokens_bonuses.filter(function(bonus) {
                return bonus.date_to === value;
            })[0];
            bonus.date_to = value.clone();
            $scope.onChangeBonusTime({field: 'time_to', model: bonus});
        }

    };

    $scope.onChangeBonusTime = function(data) {
        var bonus = data.model;

        if (data.field === 'time_from') {
            if (!bonus.date_from) return;
            var date = bonus.date_from.clone();
            date.hours(bonus.time_from.hours).minutes(bonus.time_from.minutes);
            bonus.check_from = date.format('X') * 1;
            bonus.date_from = date.clone();
        }
        if (data.field === 'time_to') {
            if (!bonus.date_to) return;
            var date = bonus.date_to.clone();
            date.hours(bonus.time_to.hours).minutes(bonus.time_to.minutes);
            bonus.check_to = date.format('X') * 1;
            bonus.date_to = date.clone();
        }
    };
    /* Управление бонусами (end) */

    var contractInProgress = false;
    $scope.createContract = function() {
        if (contractInProgress) return;
        var contractDetails = angular.copy($scope.request);

        var powerNumber = new BigNumber(10).toPower(contractDetails.decimals);

        contractDetails.rate = contractDetails.rate * 1;
        contractDetails.decimals = contractDetails.decimals * 1;
        contractDetails.start_date = contractDetails.start_date * 1;
        contractDetails.stop_date = contractDetails.stop_date * 1;

        contractDetails.hard_cap = new BigNumber(contractDetails.hard_cap).div(contractDetails.rate).times(Math.pow(10,18)).round().toString(10);
        contractDetails.soft_cap = new BigNumber(contractDetails.soft_cap).div(contractDetails.rate).times(Math.pow(10,18)).round().toString(10);

        contractDetails.token_holders.map(function(holder, index) {
            contractDetails.token_holders[index] = {
                freeze_date: holder.isFrozen ? holder.parsed_freeze_date : null,
                amount: new BigNumber(holder.amount).times(powerNumber).toString(10),
                address: holder.address,
                name: holder.name || null
            };
        });

        var data = {
            name: $scope.contractName,
            contract_type: CONTRACT_TYPES_CONSTANTS.CROWD_SALE,
            contract_details: contractDetails,
            id: contract.id
        };

        contractInProgress = true;

        contractService[!contract.id ? 'createContract' : 'updateContract'](data).then(function(response) {
            contractInProgress = false;
            $state.go('main.contracts.preview.byId', {id: response.data.id});
        }, function() {
            contractInProgress = false;
        });
    };
    $scope.editContractMode = !!contract.id;

    $scope.resetForms = function() {
        var powerNumber = new BigNumber('10').toPower(contract.contract_details.decimals || 0);
        $scope.request = angular.copy(contract.contract_details);
        $scope.contractName = contract.name;
        $scope.request.token_holders.map(function(holder) {
            holder.isFrozen = !!holder.freeze_date;
            holder.freeze_date = holder.freeze_date ? moment(holder.freeze_date * 1000) : null;
            holder.amount = new BigNumber(holder.amount).div(powerNumber).toString(10);
        });
        $scope.dates = {
            startDate: $scope.editContractMode ? moment(contract.contract_details.start_date * 1000) : moment().add(1, 'days').add(-1, 'seconds'),
            endDate: $scope.editContractMode ? moment(contract.contract_details.stop_date * 1000) : moment().add(1, 'days').add(1, 'months').seconds(0)
        };
        $scope.startTime = {
            hours: $scope.dates.startDate.hours(),
            minutes: $scope.dates.startDate.minutes()
        };
        $scope.endTime = {
            hours: $scope.dates.endDate.hours(),
            minutes: $scope.dates.endDate.minutes()
        };
        if ($scope.request.hard_cap) {
            $scope.request.hard_cap = new BigNumber($scope.request.hard_cap).times($scope.request.rate).div(Math.pow(10,18)).round().toString(10);
        }
        if ($scope.request.soft_cap) {
            $scope.request.soft_cap = new BigNumber($scope.request.soft_cap).times($scope.request.rate).div(Math.pow(10,18)).round().toString(10);
        }
        $scope.minStartDate = $scope.dates.startDate.clone().second(0);
        setStartTimestamp();
        setStopTimestamp();
        $scope.checkTokensAmount();
    };

    $scope.resetForms();

});
