angular.module('app').controller('deferredCreateController', function($scope, contractService, $timeout, $state, $rootScope, NETWORKS_TYPES_NAMES_CONSTANTS,
                                                                      CONTRACT_TYPES_CONSTANTS, openedContract, $stateParams) {


    var contract = openedContract && openedContract.data ? openedContract.data : {
        name:  'MyDeferred' + ($rootScope.currentUser.contracts + 1),
        contract_type: CONTRACT_TYPES_CONSTANTS.DEFERRED,
        network: $stateParams.network || 1,
        contract_details: {
            date: moment.tz('UTC').hour(12).startOf('h')
        }
    };
    $scope.network = {
        name: NETWORKS_TYPES_NAMES_CONSTANTS[contract.network],
        id: contract.network
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
            contractService.getBalance($scope.request.contract_details.user_address, contract.network).then(function(response) {
                var balance = (response.data.result / Math.pow(10, 18)).toFixed(5);
                $scope.checkedBalance = isNaN(balance) ? false : balance;
                balanceTimer = false;
                $scope.balanceInProgress = false;
            })
        }, 500);
    };

    $scope.onChangeDate = function(modelName, currentDate) {
        $scope.request.contract_details.date = currentDate;
    };

    $scope.resetForms = resetForm;

    var contractInProgress = false;

    var storage = window.localStorage || {};
    $scope.createContract = function() {
        var isWaitingOfLogin = $scope.checkUserIsGhost();
        if (!isWaitingOfLogin) {
            delete storage.draftContract;
            createContract();
            return;
        }
        storage.draftContract = JSON.stringify($scope.request);
        isWaitingOfLogin.then(checkDraftContract(true));
        return true;
    };

    var createContract = function() {
        if (contractInProgress) return;
        var data = angular.copy($scope.request);

        contractInProgress = true;
        contractService[!$scope.editContractMode ? 'createContract' : 'updateContract'](data).then(function(response) {
            $state.go('main.contracts.preview.byId', {id: response.data.id});
        }, function() {
            contractInProgress = false;
        });
    };

    var checkDraftContract = function(redirect) {
        if (localStorage.draftContract && !contract.id) {
            if (!contract.id) {
                var draftContract = JSON.parse(localStorage.draftContract);
                if (draftContract.contract_type == CONTRACT_TYPES_CONSTANTS.DEFERRED) {
                    contract = draftContract;
                }
            }
        }
        $scope.resetForms();
        $scope.getBalance();
        if (localStorage.draftContract && !contract.id && !$rootScope.currentUser.is_ghost) {
            $scope.createContract();
        } else if (redirect && !localStorage.draftContract) {
            $state.go('main.contracts.list');
        }
    };

    checkDraftContract();
});
