angular.module('app').controller('deferredCreateController', function($scope, contractService, $timeout, $state, $rootScope,
                                                                      CONTRACT_TYPES_CONSTANTS, openedContract) {


    var contract = openedContract && openedContract.data ? openedContract.data : {
        name:  'MyDeferred' + ($rootScope.currentUser.contracts + 1),
        contract_type: CONTRACT_TYPES_CONSTANTS.DEFERRED,
        contract_details: {
            date: moment.tz('UTC').hour(12).startOf('h')
        }
    };

    $scope.editContractMode = !!contract.id;

    var resetForm = function() {
        $scope.request = angular.copy(contract);
        $scope.request.contract_details.date = moment($scope.request.contract_details.date);
        $scope.checkedBalance = undefined;
        if (contract.id) {
            $scope.getBalance();
        }
    };

    $scope.minDate = moment.tz('UTC').hour(12).startOf('h');
    $scope.dueDate = moment.tz('UTC').hour(12).startOf('h');


    var balanceTimer;

    $scope.getBalance = function() {
        balanceTimer ? $timeout.cancel(balanceTimer) : false;
        balanceTimer = false;
        $scope.checkedBalance = false;
        if (!$scope.request.contract_details.user_address) {
            return;
        }
        $scope.balanceInProgress = true;
        balanceTimer = $timeout(function() {
            contractService.getBalance($scope.request.contract_details.user_address).then(function(response) {
                var balance = (response.data.result / Math.pow(10, 18)).toFixed(5);
                $scope.checkedBalance = isNaN(balance) ? false : balance;
                balanceTimer = false;
                $scope.balanceInProgress = false;
            })
        }, 500);
    };
    resetForm();

    var oldParams = {};

    $scope.onChangeDate = function(modelName, currentDate) {
        $scope.request.contract_details.date = currentDate;
    };

    var getCostTimeout;
    $scope.changeCondition = function() {
        var params = {
            date: $scope.request.contract_details.date.format('YYYY-MM-DD'),
            contract_type: $scope.request.contract_type
        };

        getCostTimeout ? $timeout.cancel(getCostTimeout) : false;

        var currentTimeout = getCostTimeout = $timeout(function() {
            oldParams = params;
            contractService.getCost(params).then(function(response) {
                if (currentTimeout === getCostTimeout) {
                    $scope.checkedCost = new BigNumber(response.data.result).div(Math.pow(10, 18)).round(2).toString(10);
                }
            });
        }, 1000);
    };

    $scope.changeCondition();
    $scope.$watch('request.contract_details.date', function() {
        $scope.changeCondition();
    });

    $scope.resetForms = resetForm;

    var contractInProgress = false;
    $scope.createContract = function(callback) {
        if (contractInProgress) return;
        var data = angular.copy($scope.request);

        contractInProgress = true;
        contractService[!contract.id ? 'createContract' : 'updateContract'](data).then(function(response) {
            contractInProgress = false;
            callback ? callback() : $state.go('main.contracts.preview.byId', {id: response.data.id});
        });
    };

});
