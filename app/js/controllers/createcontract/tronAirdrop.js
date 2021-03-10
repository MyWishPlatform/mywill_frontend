angular.module('app').controller('tronAirdropCreateController', function($scope, contractService, $timeout, $state, $rootScope,
                                                                      CONTRACT_TYPES_CONSTANTS, openedContract, $stateParams, TronService) {
    console.log('tronAirdropCreateController', $scope)

    var contract = openedContract && openedContract.data ? openedContract.data : {
        name:  'MyAirdrop' + ($rootScope.currentUser.contracts + 1),
        contract_type: CONTRACT_TYPES_CONSTANTS.TRON_AIRDROP,
        network: $stateParams.network,
        contract_details: {}
    };
    $scope.network = contract.network;
    $scope.editContractMode = !!contract.id;
    var resetForm = function() {
        $scope.request = angular.copy(contract);
        $scope.request.verification = contract.contract_details.verification;
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
        var contractDetails = angular.copy($scope.request);
        contractDetails.verification = !!contractDetails.verification;
        $scope.request.contract_details.verification = !!contractDetails.verification;
        var data = angular.copy($scope.request);
        data.contract_details.tron_contract = undefined;
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
                if (draftContract.contract_type == CONTRACT_TYPES_CONSTANTS.TRON_AIRDROP) {
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

    var tokenContractDecimals = 0;

    $scope.checkTokenAddress = function(token_address) {
        tokenContractDecimals = false;
        $scope.checkedTokenAddress = false;
        if (!$scope.request.contract_details.token_address) {
            return;
        }

        TronService.getContract(
            $scope.request.contract_details.token_address, $scope.request.network * 1
        ).then(function(contract) {
            if (contract) {
                TronService.checkToken(contract, $scope.request.network * 1).then(function(result) {
                    $scope.checkedTokenAddress = result;
                    token_address.$setValidity('contract-address', true);
                }, function() {
                    token_address.$setValidity('contract-address', false);
                });
            } else {
                token_address.$setValidity('contract-address', false);
            }
        });
    };
});
