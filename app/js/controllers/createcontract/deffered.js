angular.module('app').controller('defferedCreateController', function($scope, contractService, $timeout, $state, $rootScope, CONTRACT_TYPES_CONSTANTS) {



    var resetForm = function() {
        $scope.request = {
            contract_details: {
                date: moment.tz('UTC').hour(12).startOf('h')
            },
            contract_type: CONTRACT_TYPES_CONSTANTS.DEFFERED
        };
        $scope.checkedBalance = undefined;
    };

    $scope.minDate = moment.tz('UTC').hour(12).startOf('h');
    $scope.dueDate = moment.tz('UTC').hour(12).startOf('h');

    resetForm();

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
                    $scope.checkedCost = Math.ceil(response.data.result / $rootScope.weiDelta * 1000) / 1000;
                }
            });
        }, 1000);
    };

    $scope.changeCondition();
    $scope.$watch('request.contract_details.date', function() {
        $scope.changeCondition();
    });

    $scope.resetForms = function() {
        resetForm();
    };

    $scope.checkContract = function() {
        var data = {
            user_address: $scope.request.contract_details.user_address,
            date: $scope.request.contract_details.date.format('YYYY-MM-DD 00:00'),
            contract_type: $scope.request.contract_type
        };
        $scope.previewContractPopUp.createdContract = angular.copy($scope.request);
        $scope.previewContractPopUp.createdContract.contract_details.date = $scope.request.contract_details.date.format('YYYY-MM-DD');
        $scope.previewContractPopUp.createdContract.contractTpl = 'deffered';
        $scope.previewContractPopUp.createdContract.cost = $scope.checkedCost;

        contractService.getCode(data).then(function(response) {
            $scope.previewContractPopUp.createdContract.source_code = response.data.result;
        });
    };

    var contractInProgress = false;
    var createContract = function(callback) {
        if (contractInProgress) return;
        var data = angular.copy($scope.request);
        data.name = $scope.previewContractPopUp.createdContract.name;

        contractInProgress = true;
        contractService.createContract(data).then(function(response) {
            contractInProgress = false;
            callback ? callback() : $state.go('main.contracts.preview.pay', {id: response.data.id});
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

    var goToLogin = function() {
        createContract(function() {
            window.location.href = '/auth';
        });
    };
    var goToRegistration = function() {
        createContract(function() {
            window.location = '/auth/registration';
        });
    };
    $scope.previewContractPopUp = {
        createContract: createContract,
        goToLogin: goToLogin,
        goToRegistration: goToRegistration,
        successCodeCopy: successCodeCopy,
        failCodeCopy: failCodeCopy
    };

});
