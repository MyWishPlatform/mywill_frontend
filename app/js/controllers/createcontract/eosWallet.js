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
    var costDefer, costSentData;

    $scope.getContractCost = function(advancedSettings) {
        if ($scope.network === 11) return;
        if ($scope.getCostProgress) {
            $timeout.cancel($scope.getCostProgress);
        }
        var data = costSentData = {
            buy_ram_kbytes: $scope.setAdvancedSettings ? $scope.request.contract_details.buy_ram_kbytes : 4,
            stake_net_value: $scope.setAdvancedSettings ? $scope.request.contract_details.stake_net_value : ($scope.network == 10 ? 0.01 : 10),
            stake_cpu_value: $scope.setAdvancedSettings ? $scope.request.contract_details.stake_cpu_value : ($scope.network == 10 ? 0.64 : 10)
        };

        if (advancedSettings && !advancedSettings.$valid) {
            $scope.eosAccountCost = false;
            return;
        }

        $scope.getCostProgress = $timeout(function(){
            costDefer = contractService.getEOSCost(costSentData).then(function(response) {
                $scope.getCostProgress = false;
                if (data !== costSentData) return;
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

    var initalizedEOSHandlers = [], onInitEOS;

    EOSService.getTableRows('eosio', 'rammarket', 'eosio', $scope.network).then(function(response) {
        var ramPrice = response.rows[0]['quote']['balance'].split(" ")[0] / response.rows[0]['base']['balance'].split(" ")[0] * 1024;
        onInitEOS = true;
        while (initalizedEOSHandlers.length) {
            var handler = initalizedEOSHandlers.shift();
            handler['method'](handler['params']);
        }
        EOSService.checkAddress('eosio', $scope.network).then(function(response) {
            $scope.EOSprices = {
                NET: response.net_limit.max / 1024 / (response.net_weight / 10000),
                CPU: response.cpu_limit.max / 1000 / (response.cpu_weight / 10000),
                RAM: ramPrice
            };
        });
    });


    $scope.checkAccountName = function(accountNameForm) {
        if (!onInitEOS) {
            initalizedEOSHandlers = initalizedEOSHandlers.filter(function(handler) {
                return handler['method'] !== $scope.checkAccountName;
            });
            initalizedEOSHandlers.push({
                method: $scope.checkAccountName,
                param: accountNameForm
            });
            return;
        }

        accountNameForm['account-name'].$setValidity('check-sum', true);
        if (!accountNameForm.$valid) return;
        accountNameForm['account-name'].$setValidity('checked-address', false);
        EOSService.checkAddress($scope.request.contract_details.account_name.toLowerCase(), $scope.network).then(function() {
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