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



    $scope.preCheckToken = function(ctrl) {
        ctrl.$setValidity('not-used', true);
    };

    var airdropAccount = EOSService.getAirdropAddress($scope.network);

    $scope.checkAirdropToken = function(ctrl) {
        var details = $scope.request.contract_details;
        ctrl.$setValidity('not-checked', false);
        EOSService.getTableRows(
            details.admin_address,
            'drop',
            airdropAccount,
            $scope.network
        ).then(function(response) {
            var result = response.rows;
            var tokens = {};
            ctrl.$setValidity('not-checked', true);
            result.map(function(row) {
                tokens[row.symbol.split(',')[1]] = row;
            });
            if (tokens[details['token_short_name']]) {
                ctrl.$setValidity('not-used', false);
            }
        });
    };

});
