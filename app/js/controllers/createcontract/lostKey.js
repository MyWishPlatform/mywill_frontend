angular.module('app').controller('lostKeyCreateController', function($scope, contractService, $timeout, $state, $rootScope,
                                                                     openedContract,
                                                                     CONTRACT_TYPES_CONSTANTS) {

    $scope.request = {
    };
    $scope.listWalletActivity = [
        {
            value: 1,
            name: 'Outcome transactions'
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
            check_interval: $scope.checkPeriod * $scope.checkPeriodSelect * 3600 * 24,
            contract_type: 1
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
                        $scope.checkedCost = new BigNumber(response.data.result + '').div(Math.pow(10, 18)).round(2).toString(10);
                    }
                });
            }, 1000);

        }
    };

    $scope.checkPeriod = 1;
    $scope.$watch('checkPeriodSelect', $scope.changeCondition);

    $scope.$watch('dueDate', function() {
        $scope.changeCondition();
    });
    $scope.$watch('hairsList', $scope.changeCondition);

    var contract = openedContract && openedContract.data ? openedContract.data : {
        name:  'MyLostKey' + ($rootScope.currentUser.contracts + 1),
        contract_details: {}
    };

    $scope.editContractMode = !!contract.id;


    var contractInProgress = false;
    $scope.createContract = function(callback) {
        if (contractInProgress) return;
        var data = {
            name: $scope.contractName,
            id: contract.id,
            contract_type: CONTRACT_TYPES_CONSTANTS.LOST_KEY,
            contract_details: {
                user_address: $scope.walletAddress,
                check_interval: $scope.checkPeriod * $scope.checkPeriodSelect * 3600 * 24,
                active_to: $scope.dueDate.format('YYYY-MM-DD 00:00'),
                heirs: angular.copy($scope.hairsList)
            }
        };
        contractInProgress = true;
        contractService[!contract.id ? 'createContract' : 'updateContract'](data).then(function(response) {
            contractInProgress = false;
            $state.go('main.contracts.preview.byId', {id: response.data.id});
        }, function() {
            contractInProgress = false;
        });
    };

    $scope.hairPercentChange = function() {
        var sum = $scope.hairsList.reduce(function(acc, elem) {
            acc+= elem.percentage;
            return acc;
        }, 0);
        $scope.percentageSum = sum;
        $scope.percentageStatus = sum > 100 ? 0 : (sum < 100 ? 1 : 2);
    };

    $scope.resetForms = function() {
        $scope.contractName = contract.name;
        $scope.walletAddress = contract.contract_details.user_address;
        $scope.walletAddress ? $scope.getBalance() : false;
        $scope.checkedBalance = undefined;
        $scope.hairsList = contract.contract_details.heirs || [{
            percentage: 100
        }];


        var checkInterval = contract.contract_details.check_interval ? $scope.durationList.filter(function(check) {
            return !(contract.contract_details.check_interval % (check.value * 24 * 3600));
        }) : false;

        var lastCheckInterval = checkInterval ? checkInterval[checkInterval.length - 1] : false;
        $scope.checkPeriod = lastCheckInterval ? contract.contract_details.check_interval / (lastCheckInterval.value * 24 * 3600) : 1;
        $scope.checkPeriodSelect = lastCheckInterval ? lastCheckInterval.value : 1;

        $scope.dueDate = contract.contract_details.active_to ? moment(contract.contract_details.active_to) : moment.tz('UTC').hour(12).startOf('h');

        $scope.hairPercentChange();
    };
    $scope.resetForms();
});
