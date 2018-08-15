angular.module('app').controller('eosWalletCreateController', function($scope, contractService, $timeout, $state, $rootScope, EOSService,
                                                                          CONTRACT_TYPES_CONSTANTS, openedContract, $stateParams) {


    var contract = openedContract && openedContract.data ? openedContract.data : {
        contract_type: CONTRACT_TYPES_CONSTANTS.EOS_WALLET,
        network: $stateParams.network,
        contract_details: {}
    };
    $scope.network = contract.network * 1;
    $scope.havePublicKeys = true;

    $scope.editContractMode = !!contract.id;

    var resetForm = function() {
        $scope.request = angular.copy(contract);
    };

    $scope.resetForms = resetForm;

    var contractInProgress = false;

    var storage = window.localStorage || {};

    $scope.createContract = function() {
        var isWaitingOfLogin = $scope.checkUserIsGhost();

        var contractData = angular.copy($scope.request);
        if (!$scope.havePublicKeys) {
            contractData.contract_details.active_public_key = $scope.generated_keys.active_public_key;
            contractData.contract_details.owner_public_key = $scope.generated_keys.owner_public_key;
        }

        if (!isWaitingOfLogin) {
            delete storage.draftContract;
            createContract(contractData);
            return;
        }
        storage.draftContract = JSON.stringify(contractData);
        isWaitingOfLogin.then(function() {
            checkDraftContract(true)
        });
        return true;
    };

    var createContract = function(contractData) {
        if (contractInProgress) return;

        contractInProgress = true;
        contractData.name = contractData.contract_details.account_name;
        contractService[!$scope.editContractMode ? 'createContract' : 'updateContract'](contractData).then(function(response) {
            $state.go('main.contracts.preview.byId', {id: response.data.id});
        }, function() {
            contractInProgress = false;
        });
    };

    var checkDraftContract = function(redirect) {
        if (storage.draftContract && !contract.id) {
            if (!contract.id) {
                var draftContract = JSON.parse(storage.draftContract);
                if (draftContract.contract_type == CONTRACT_TYPES_CONSTANTS.EOS_WALLET) {
                    contract = draftContract;
                }
            }
        }
        $scope.resetForms();

        if (storage.draftContract && !contract.id && !$rootScope.currentUser.is_ghost) {
            $scope.createContract(draftContract);
        } else if (redirect && !storage.draftContract) {
            $state.go('main.contracts.list');
        }
    };

    checkDraftContract();

    EOSService.createEosChain($scope.network);
    $scope.checkAccountName = function(accountNameForm) {
        accountNameForm['account-name'].$setValidity('check-sum', true);
        if (!accountNameForm.$valid) return;
        accountNameForm['account-name'].$setValidity('checked-address', false);
        EOSService.checkAddress($scope.request.contract_details.account_name).then(function() {
            accountNameForm['account-name'].$setValidity('checked-address', true);
            accountNameForm['account-name'].$setValidity('check-sum', false);
        }, function() {
            accountNameForm['account-name'].$setValidity('checked-address', true);
            accountNameForm['account-name'].$setValidity('check-sum', true);
        });
    };

    $scope.checkPublicKey = function(keysForm, field) {
        keysForm[field].$setValidity('public-key', Eos.modules.ecc.isValidPublic(keysForm[field].$viewValue));
    };

    $scope.generated_keys = {};
    $scope.copiedText = '';

    $scope.copiedKeys = false;
    $scope.generateTextForCopy = function() {
        var lines = [
            "Private active key: " + $scope.generated_keys.active_private_key,
            "Private owner key: " + $scope.generated_keys.owner_private_key,
            "Public active key: " + $scope.generated_keys.active_public_key,
            "Public owner key: " + $scope.generated_keys.owner_public_key
        ];
        $scope.copiedKeys = true;
        $scope.copiedText = lines.join("\n");
    };
    $scope.generateKeysPairs = function() {
        $scope.copiedKeys = false;
        Eos.modules.ecc.randomKey().then(function(privateKey) {
            $scope.generated_keys.active_public_key = Eos.modules.ecc.privateToPublic(privateKey);
            $scope.generated_keys.active_private_key = privateKey;
        });
        Eos.modules.ecc.randomKey().then(function(privateKey) {
            $scope.generated_keys.owner_public_key = Eos.modules.ecc.privateToPublic(privateKey);
            $scope.generated_keys.owner_private_key = privateKey;
        });
    };
});