angular.module('app').controller('createcontractController', function($scope, contractService, $timeout, $state, $rootScope) {

    $scope.request = {};
    $scope.listWalletActivity = [
        {
            value: 1,
            name: 'Outcome'
        }
    ];
    $scope.durationList = [
        {
            value: 1,
            name: 'day'
        }, {
            value: 30,
            name: 'month'
        }, {
            value: 365,
            name: 'year'
        }
    ];
    $scope.currencyList = [
        {
            value: 1,
            name: 'ETH'
        }, {
            value: 2,
            name: 'WEI'
        }
    ];

    $scope.hairsList = [{
        percentage: 100
    }];

    $scope.addHair = function() {

        var mod = 100 % $scope.hairsList.length;
        var oneHair = 100 / $scope.hairsList.length;
        var newHairMod = 100 % ($scope.hairsList.length + 1);
        var newOneHair = 100 / ($scope.hairsList.length + 1);
        var sum = 0;

        var oldSecondsValue = Math.floor(oneHair);
        var oldFirstValue = oldSecondsValue + mod;
        var newSecondsValue = Math.floor(newOneHair);
        var newFirstValue = newSecondsValue + newHairMod;

        $scope.hairsList.map(function(hair, ind) {
            switch (ind) {
                case 0:
                    hair.percentage = (hair.percentage !== oldFirstValue) ? hair.percentage : newFirstValue;
                    break;
                default:
                    hair.percentage = (hair.percentage !== oldSecondsValue) ? hair.percentage : newSecondsValue;
                    break;
            }
            sum+= hair.percentage;
        });
        $scope.hairsList.push({percentage: Math.max(0, 100 - sum)});
    };


    $scope.removeHair = function(hair) {
        var currentList = $scope.hairsList.filter(function(h) {
            return h != hair;
        });
        if (currentList.length === 1) {
            currentList[0].percentage = 100;
        }
        $scope.hairsList = currentList;
        $scope.hairPercentChange();
    };

    $scope.walletAddress = '';
    var balanceTimer;

    $scope.getBalance = function() {
        balanceTimer ? $timeout.cancel(balanceTimer) : false;
        balanceTimer = false;
        $scope.checkedBalance = false;
        if (!$scope.walletAddress) {
            return;
        }
        $scope.balanceInProgress = true;
        balanceTimer = $timeout(function() {
            contractService.getBalance($scope.walletAddress).then(function(response) {
                var balance = (response.data.result / Math.pow(10, 18)).toFixed(5);
                $scope.checkedBalance = isNaN(balance) ? false : balance;
                balanceTimer = false;
                $scope.balanceInProgress = false;
            })
        }, 500);
    };

    $scope.minDate = moment.tz('UTC').hour(12).startOf('h');
    $scope.dueDate = moment.tz('UTC').hour(12).startOf('h');

    var oldParams = {};

    $scope.onChangeDate = function(modelName, currentDate) {
        $scope.dueDate = currentDate;
    };

    var getCostTimeout;
    $scope.changeCondition = function() {
        var params = {
            heirs_num: $scope.hairsList.length,
            active_to: $scope.dueDate.format('YYYY-MM-DD'),
            check_interval: $scope.checkPeriod * $scope.checkPeriodSelect * 3600 * 24
        };
        var changed = false;
        for (var k in params) {
            if (!params[k]) return;
            changed = changed || (oldParams[k] !== params[k]);
        }
        if (changed) {
            getCostTimeout ? $timeout.cancel(getCostTimeout) : false;
            var currentTimeout = getCostTimeout = $timeout(function() {
                oldParams = params;
                contractService.getCost(params).then(function(response) {
                    if (currentTimeout === getCostTimeout) {
                        $scope.checkedCost = Math.ceil(response.data.result / $rootScope.weiDelta * 1000) / 1000;
                    }
                });
            }, 1000);

        }
    };

    $scope.costCurrency = 2;
    $scope.checkPeriod = 1;
    $scope.$watch('checkPeriodSelect', $scope.changeCondition);

    $scope.changeCondition();
    $scope.$watch('dueDate', function() {
        $scope.changeCondition();
    });
    $scope.$watch('hairsList', $scope.changeCondition);

    // $scope.walletAddress = "0x58b8c421a288a1adf92d94735c99b8c6a7d97e8f";

    $scope.resetForms = function() {
        $scope.walletAddress = undefined;
        $scope.checkedBalance = undefined;
        $scope.hairsList = [{
            percentage: 100
        }];
        $scope.costCurrency = 2;
        $scope.checkPeriod = 1;
        $scope.checkPeriodSelect = 1;
        $scope.dueDate = moment.tz('UTC').hour(12).startOf('h');
    };

    $scope.checkContract = function() {
        var data = {
            user_address: $scope.walletAddress,
            heirs: $scope.hairsList,
            check_interval: $scope.checkPeriod * $scope.checkPeriodSelect * 3600 * 24,
            active_to: $scope.dueDate.format('YYYY-MM-DD 00:00')
        };
        var nextCheckDate = moment.tz('UTC').add($scope.checkPeriod * $scope.checkPeriodSelect, 'day');
        nextCheckDate = nextCheckDate > $scope.dueDate ? $scope.dueDate : nextCheckDate;


        $scope.previewContractPopUp.createdContract = {
            user_address: $scope.walletAddress,
            heirs: $scope.hairsList,
            balance: $scope.checkedBalance,
            cost: $scope.checkedCost,
            active_to: $scope.dueDate.format('YYYY-MM-DD'),
            nextCheck: nextCheckDate.format('YYYY-MM-DD'),
            check_interval: {
                period: $scope.checkPeriod,
                periodUnit: $scope.durationList.filter(function(unit) {
                    return unit.value === $scope.checkPeriodSelect;
                })[0]['name']
            }
        };
        contractService.getCode(data).then(function(response) {
            $scope.previewContractPopUp.createdContract.source_code = response.data.result;
        });
    };

    var createContract = function() {
        var data = {
            user_address: $scope.walletAddress,
            heirs: $scope.hairsList,
            check_interval: $scope.checkPeriod * $scope.checkPeriodSelect * 3600 * 24,
            active_to: $scope.dueDate.format('YYYY-MM-DD 00:00'),
            name: $scope.previewContractPopUp.createdContract.name
        };
        contractService.createContract(data).then(function(response) {
            $state.go('main.contracts.preview.pay', {id: response.data.id});
        });
    };

    var copiedTimeout;
    var successCodeCopy = function() {
        copiedTimeout ? $timeout.cancel(copiedTimeout) : false;
        $scope.previewContractPopUp.copied = true;
        copiedTimeout = $timeout(function() {
            $scope.previewContractPopUp.copied = false;
        }, 3000);
    };
    var failCodeCopy = function() {
        console.log(arguments);
    };

    $scope.previewContractPopUp = {
        createContract: createContract,
        successCodeCopy: successCodeCopy,
        failCodeCopy: failCodeCopy
    };

    $scope.hairPercentChange = function() {
        var sum = $scope.hairsList.reduce(function(acc, elem) {
            acc+= elem.percentage;
            return acc;
        }, 0);
        $scope.percentageSum = sum;
        $scope.percentageStatus = sum > 100 ? 0 : (sum < 100 ? 1 : 2);
    };
    $scope.hairPercentChange();

});
