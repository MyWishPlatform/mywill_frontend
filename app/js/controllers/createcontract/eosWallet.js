angular.module('app').controller('eosWalletCreateController', function($scope, contractService, $timeout, $state, $rootScope, EOSService,
                                                                       CONTRACT_TYPES_CONSTANTS, openedContract, $stateParams, $q) {

    var contract = openedContract && openedContract.data ? openedContract.data : {
        contract_type: CONTRACT_TYPES_CONSTANTS.EOS_WALLET,
        network: $stateParams.network,
        contract_details: {}
    };
    $scope.network = contract.network * 1;
    $scope.havePublicKeys = true;
    $scope.editContractMode = !!contract.id;
    $scope.setAdvancedSettings = $scope.editContractMode;

    var resetForm = function() {
        $scope.havePublicKeys = true;
        $scope.request = angular.copy(contract);
        if ($scope.request.id) {
            $scope.getContractCost();
        }
    };

    $scope.resetForms = resetForm;

    $scope.getCostProgress = false;

    var chooseMode = false;
    $scope.setAdvanced = function(form) {
        chooseMode = true;
        $timeout(function() {
            chooseMode = false;
            $scope.getContractCost(form);
        });
    };


    var costRequest;
    $scope.getContractCost = function(advancedSettings, checkbox) {

        if (chooseMode || ($scope.network === 11)) return;

        if ($scope.getCostProgress) {
            $timeout.cancel($scope.getCostProgress);
            $scope.getCostProgress = false;
        }

        $scope.eosAccountCost = false;

        var costSentData = {
            buy_ram_kbytes: $scope.setAdvancedSettings ?
                $scope.request.contract_details.buy_ram_kbytes : 4,
            stake_net_value: $scope.setAdvancedSettings ?
                $scope.request.contract_details.stake_net_value : 0.01,
            stake_cpu_value: $scope.setAdvancedSettings ?
                $scope.request.contract_details.stake_cpu_value : 0.64
        };

        if ($scope.setAdvancedSettings && (advancedSettings && !advancedSettings.$valid)) {
            return;
        }

        var timeout = $scope.getCostProgress = $timeout(function() {
            contractService.getEOSCost(costSentData).then(function(response) {
                if (timeout !== $scope.getCostProgress) return;
                $scope.getCostProgress = false;
                for (var i in response.data) {
                    response.data[i] = Math.round(response.data[i] * 100) / 100;
                }
                $scope.eosAccountCost = response.data;
            });
        }, 1000);
    };

    resetForm();
    $scope.contractInProgress = false;
    var storage = window.localStorage || {};

    $scope.createContract = function() {
        var isWaitingOfLogin = $scope.checkUserIsGhost();
        var contractData = angular.copy($scope.request);

        if (!$scope.havePublicKeys) {
            contractData.contract_details.active_public_key = $scope.generated_keys.active_public_key;
            contractData.contract_details.owner_public_key = $scope.generated_keys.owner_public_key;
        }

        if ($scope.setAdvancedSettings) {
            contractData.contract_details.stake_cpu_value*= 1;
            contractData.contract_details.stake_net_value*= 1;
            contractData.contract_details.buy_ram_kbytes*= 1;
        } else {
            contractData.contract_details.stake_cpu_value = ($scope.network == 10 ? 0.64 : 10);
            contractData.contract_details.stake_net_value = ($scope.network == 10 ? 0.01 : 10);
            contractData.contract_details.buy_ram_kbytes = 4;
        }

        contractData.contract_details.account_name = contractData.contract_details.account_name.toLowerCase();

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
        if ($scope.contractInProgress) return;

        $scope.contractInProgress = true;
        contractData.name = contractData.contract_details.account_name;

        contractService[!$scope.editContractMode ? 'createContract' : 'updateContract'](contractData).then(function(response) {
            $state.go('main.contracts.preview.byId', {id: response.data.id});
        }, function() {
            $scope.contractInProgress = false;
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

    EOSService.getTableRows('eosio', 'rammarket', 'eosio', $scope.network).then(function(response) {
        var ramPrice = response.rows[0]['quote']['balance'].split(" ")[0] / response.rows[0]['base']['balance'].split(" ")[0] * 1024;
        EOSService.checkAddress('eosio', $scope.network).then(function(response) {
            $scope.EOSprices = {
                NET: response.net_limit.max / 1024 / (response.net_weight / 10000),
                CPU: response.cpu_limit.max / 1000 / (response.cpu_weight / 10000),
                RAM: ramPrice
            };
        });
    });

    $scope.checkPublicKey = function(keysForm, field) {
        // keysForm[field].$setValidity('public-key', Eos.modules.ecc.isValidPublic(keysForm[field].$viewValue));
        keysForm[field].$setValidity('public-key', NewEos.isValidPublic(keysForm[field].$viewValue));
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

        window.eosjs_ecc.randomKey().then(function(privateKey) {
            $scope.generated_keys.active_public_key = window.eosjs_ecc.privateToPublic(privateKey);
            $scope.generated_keys.active_private_key = privateKey;
        });

        window.eosjs_ecc.randomKey().then(function(privateKey) {
            $scope.generated_keys.owner_public_key = window.eosjs_ecc.privateToPublic(privateKey);
            $scope.generated_keys.owner_private_key = privateKey;
        });
    };
});