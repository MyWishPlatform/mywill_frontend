angular.module('app').controller('defferedCreateController', function($scope, contractService, $timeout, $state, $rootScope, CONTRACT_TYPES_CONSTANTS) {

    $scope.request = {};

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
            active_to: $scope.dueDate.format('YYYY-MM-DD')
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
    $scope.$watch('dueDate', function() {
        $scope.changeCondition();
    });

    $scope.resetForms = function() {
        $scope.walletAddress = undefined;
        $scope.checkedBalance = undefined;
        $scope.dueDate = moment.tz('UTC').hour(12).startOf('h');
    };

    $scope.checkContract = function() {
        var data = {
            user_address: $scope.walletAddress,
            active_to: $scope.dueDate.format('YYYY-MM-DD 00:00')
        };
        $scope.previewContractPopUp.createdContract = {
            user_address: $scope.walletAddress,
            cost: $scope.checkedCost,
            active_to: $scope.dueDate.format('YYYY-MM-DD'),
            contract_type: CONTRACT_TYPES_CONSTANTS.DEFFERED,
            contractTpl: 'deffered'
        };
        contractService.getCode(data).then(function(response) {
            $scope.previewContractPopUp.createdContract.source_code = response.data.result;
        });
    };

    var contractInProgress = false;
    var createContract = function(callback) {
        if (contractInProgress) return;
        var data = {
            user_address: $scope.walletAddress,
            active_to: $scope.dueDate.format('YYYY-MM-DD 00:00'),
            name: $scope.previewContractPopUp.createdContract.name,
            contract_type: CONTRACT_TYPES_CONSTANTS.LOST_KEY
        };
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
