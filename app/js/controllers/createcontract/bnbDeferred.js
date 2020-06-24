angular.module('app').controller('bnbDeferredCreateController', function($scope, contractService, $timeout, $state, $rootScope,
                                                                      CONTRACT_TYPES_CONSTANTS, openedContract, $stateParams, web3Service) {


    var contract = openedContract && openedContract.data ? openedContract.data : {
        name:  'MyDeferred' + ($rootScope.currentUser.contracts + 1),
        contract_type: CONTRACT_TYPES_CONSTANTS.BNB_DEFERRED,
        network: $stateParams.network,
        contract_details: {
            date: moment.tz('UTC').add(1, 'days').hour(12).startOf('h')
        }
    };
    $scope.network = contract.network;

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

    web3Service.setProviderByNumber(contract.network);
    $scope.getBalance = function() {
        balanceTimer ? $timeout.cancel(balanceTimer) : false;
        balanceTimer = false;
        $scope.checkedBalance = false;
        if (!$scope.request.contract_details.user_address) {
            return;
        }
        $scope.balanceInProgress = true;
        balanceTimer = $timeout(function() {
            web3Service.getBalance($scope.request.contract_details.user_address).then(function(balance) {
                balance = new BigNumber(Web3.utils.fromWei(balance, 'ether')).round(2).toString(10);
                $scope.checkedBalance = balance;
                balanceTimer = false;
                $scope.balanceInProgress = false;
            })
        }, 500);
    };

    $scope.onChangeDate = function(modelName, currentDate) {
        $scope.request.contract_details.date = currentDate;
    };

    $scope.resetForms = resetForm;

    $scope.contractInProgress = false;

    var storage = window.localStorage || {};
    $scope.createContract = function() {
        var isWaitingOfLogin = $scope.checkUserIsGhost();
        if (!isWaitingOfLogin) {
            delete storage.draftContract;
            createContract();
            return;
        }
        storage.draftContract = JSON.stringify($scope.request);
        isWaitingOfLogin.then(function() {
            checkDraftContract(true)
        });
        return true;
    };

    var createContract = function() {
        if ($scope.contractInProgress) return;
        var data = angular.copy($scope.request);

        $scope.contractInProgress = true;
        contractService[!$scope.editContractMode ? 'createContract' : 'updateContract'](data).then(function(response) {
            $state.go('main.contracts.preview.byId', {id: response.data.id});
        }, function() {
            $scope.contractInProgress = false;
        });
    };

    var checkDraftContract = function(redirect) {
        if (localStorage.draftContract && !contract.id) {
            if (!contract.id) {
                var draftContract = JSON.parse(localStorage.draftContract);
                if (draftContract.contract_type == CONTRACT_TYPES_CONSTANTS.BNB_DEFERRED) {
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

    $scope.setWalletAddress = function() {
        $scope.request.contract_details.user_address = $scope.testAddresses.ETH;
        $scope.getBalance();
    };
});
