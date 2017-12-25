angular.module('app').controller('crowdSaleCreateController', function(exRate, $scope, currencyRate, contractService,
                                                                       openedContract,
                                                                       $timeout, $state, $rootScope, CONTRACT_TYPES_CONSTANTS) {

    var startAddingTimeHours = 2;
    var minSaleTimeHours = 1;

    $scope.wishCost = new BigNumber(exRate.data.WISH).round(2).toString(10);
    $scope.currencyRate = currencyRate.data;

    var setStartTimestamp = function() {
        var date = $scope.dates.startDate.clone();
        date.hours($scope.startTime.hours).minutes($scope.startTime.minutes).second(0);
        $scope.request.start_date = date.format('X');
    };
    var setStopTimestamp = function() {
        var date = $scope.dates.endDate.clone();
        date.hours($scope.endTime.hours).minutes($scope.endTime.minutes).second(0);
        $scope.request.stop_date = date.format('X');
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
    $scope.addRecipient = function() {
        $scope.request.token_holders.push({
            freeze_date: $scope.dates.endDate.clone()
        });
    };
    $scope.removeRecipient = function(recipient) {
        $scope.request.token_holders = $scope.request.token_holders.filter(function(rec) {
            return rec !== recipient;
        });
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

    var contractInProgress = false;


    $scope.createContract = function(callback) {
        if (contractInProgress) return;
        var contractDetails = angular.copy($scope.request);

        var powerNumber = new BigNumber(10).toPower(contractDetails.decimals);

        contractDetails.rate = contractDetails.rate * 1;
        contractDetails.decimals = contractDetails.decimals * 1;
        contractDetails.start_date = contractDetails.start_date * 1;
        contractDetails.stop_date = contractDetails.stop_date * 1;

        contractDetails.hard_cap = new BigNumber(contractDetails.hard_cap).times(Math.pow(10,18)).toString(10);
        contractDetails.soft_cap = new BigNumber(contractDetails.soft_cap).times(Math.pow(10,18)).toString(10);


        contractDetails.token_holders.map(function(holder, index) {
            contractDetails.token_holders[index] = {
                freeze_date: holder.isFrozen ? holder.freeze_date.format('X') * 1 : null,
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

    var contract = openedContract && openedContract.data ? openedContract.data : {
        name:  'MyCrowdSale' + ($rootScope.currentUser.contracts + 1),
        contract_details: {
            token_holders: []
        }
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
            startDate: $scope.editContractMode ? moment(contract.contract_details.start_date * 1000) : moment().add(startAddingTimeHours, 'hours'),
            endDate: $scope.editContractMode ? moment(contract.contract_details.stop_date * 1000) : moment().add(startAddingTimeHours + minSaleTimeHours, 'hours')
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
            $scope.request.hard_cap = new BigNumber($scope.request.hard_cap).div(Math.pow(10,18)).toString(10);
        }
        if ($scope.request.soft_cap) {
            $scope.request.soft_cap = new BigNumber($scope.request.soft_cap).div(Math.pow(10,18)).toString(10);
        }

        $scope.minStartDate = $scope.dates.startDate.clone();
        $scope.checkTokensAmount();
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
    $scope.resetForms();

}).directive('ngStartEndDateValidate', function () {
    return {
        require: 'ngModel',
        scope: {
            ngStartEndDateValidate: '='
        },
        link: function(scope, elem, attr, ngModel) {
            var startAddingTimeHours = 2,
                minSaleTimeHours = 3600,
                startFormFill = moment().add(startAddingTimeHours, 'hours').seconds(0).add(-1, 'seconds');
            var validator = function(value) {
                if (scope.ngStartEndDateValidate.watch_date === 'stop_date') {
                    if (moment(scope.ngStartEndDateValidate.dates.start_date * 1000) < startFormFill) {
                        ngModel.$setValidity('sale-dates', false);
                        return value;
                    }
                }
                var valid = scope.ngStartEndDateValidate.dates.stop_date * 1 - scope.ngStartEndDateValidate.dates.start_date * 1 >= minSaleTimeHours;
                ngModel.$setValidity('sale-dates', valid);
                return value;
            };
            ngModel.$parsers.unshift(validator);
            ngModel.$formatters.unshift(validator);
            scope.$watch('ngStartEndDateValidate.dates.' + scope.ngStartEndDateValidate.watch_date, function() {
                ngModel.$$parseAndValidate();
            });
        }
    };
}).directive('ngCheckDates', function() {
    return {
        require: 'ngModel',
        scope: {
            ngCheckDates: '='
        },
        link: function (scope, elem, attr, ngModel) {
            ngModel.$parsers.unshift(function(value) {
                var valid = scope.ngCheckDates.allData[scope.ngCheckDates.minDate] * 1 <= ngModel.$modelValue.format('X') * 1;
                ngModel.$setValidity('check-dates', valid);
                return ngModel.$modelValue;
            });

            ngModel.$formatters.unshift(function(value) {
                var valid = scope.ngCheckDates.allData[scope.ngCheckDates.minDate] * 1 <= ngModel.$modelValue.format('X') * 1;
                ngModel.$setValidity('check-dates', valid);
                return value;
            });
            scope.$watch('ngCheckDates.allData.' + scope.ngCheckDates.minDate, function() {
                ngModel.$$parseAndValidate();
            });
        }
    }
});
