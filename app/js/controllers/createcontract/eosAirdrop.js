angular.module('app').controller('eosAirdropCreateController', function($scope, contractService, $timeout, $state, $rootScope,
                                                                      CONTRACT_TYPES_CONSTANTS, openedContract, $stateParams, EOSService) {


    var contract = openedContract && openedContract.data ? openedContract.data : {
        name:  'MyAirdrop' + ($rootScope.currentUser.contracts + 1),
        contract_type: CONTRACT_TYPES_CONSTANTS.AIRDROP_EOS,
        network: $stateParams.network,
        contract_details: {}
    };
    $scope.network = contract.network;

    $scope.editContractMode = !!contract.id;

    var resetForm = function() {
        $scope.request = angular.copy(contract);
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
        data.contract_details.token_short_name = data.contract_details.token_short_name.toUpperCase();
        data.contract_details.eos_contract = undefined;
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
                if (draftContract.contract_type == CONTRACT_TYPES_CONSTANTS.AIRDROP_EOS) {
                    contract = draftContract;
                }
            }
        }
        resetForm();
        if (localStorage.draftContract && !contract.id && !$rootScope.currentUser.is_ghost) {
            $scope.createContract();
        } else if (redirect && !localStorage.draftContract) {
            $state.go('main.contracts.list');
        }
    };
    checkDraftContract();

    var checkAddressTimeout;
    $scope.checkAddress = function(addressField) {
        addressField.$setValidity('not-checked', false);
        if (!addressField.$viewValue) {
            return;
        }
        checkAddressTimeout ? $timeout.cancel(checkAddressTimeout) : false;
        checkAddressTimeout = $timeout(function() {
            EOSService.checkAddress(addressField.$viewValue, contract.network).then(function(addressInfo) {
                addressField.$setValidity('not-checked', true);
            });
        }, 500);
    };


    var checkTokenTimeout;
    $scope.checkTokenName = function(tokenShortName) {
        tokenShortName.$setValidity('not-checked', false);
        tokenShortName.$setValidity('check-sum', true);
        if (!tokenShortName.$viewValue) {
            return;
        }
        checkTokenTimeout ? $timeout.cancel(checkTokenTimeout) : false;
        checkTokenTimeout = $timeout(function() {
            var symbol = tokenShortName.$viewValue.toUpperCase();
            EOSService.coinInfo(symbol, contract.network).then(function(result) {
                if (!result[symbol]) {
                    tokenShortName.$setValidity('check-sum', false);
                }
                tokenShortName.$setValidity('not-checked', true);
            }, function() {
                tokenShortName.$setValidity('not-checked', true);
            });
        }, 200);
    };

});
