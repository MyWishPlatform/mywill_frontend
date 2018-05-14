angular.module('app').controller('tokenCreateController', function($scope, contractService, $timeout, $state, $rootScope, NETWORKS_TYPES_CONSTANTS,
                                                                      CONTRACT_TYPES_CONSTANTS, openedContract, $stateParams) {

    var contract = openedContract && openedContract.data ? openedContract.data : {
        network: $stateParams.network,
        contract_details: {
            token_holders: [],
            token_type: 'ERC20'
        }
    };

    $scope.network = contract.network;

    $scope.minStartDate = moment().add(1, 'days');

    $scope.addRecipient = function() {
        var holder = {
            freeze_date: $scope.minStartDate.clone().add(1, 'minutes')
        };
        $scope.token_holders.push(holder);
        $scope.onChangeDateOfRecipient('', holder.freeze_date);
    };
    $scope.removeRecipient = function(recipient) {
        $scope.token_holders = $scope.token_holders.filter(function(rec) {
            return rec !== recipient;
        });
        if (!$scope.token_holders.length) {
            $scope.request.future_minting = true;
        }
    };

    $scope.checkTokensAmount = function() {
        var holdersSum = $scope.token_holders.reduce(function (val, item) {
            var value = new BigNumber(item.amount || 0);
            return value.plus(val);
        }, new BigNumber(0));
        var stringValue = holdersSum.toString(10);
        $scope.tokensAmountError = (holdersSum.toString(10) == 0) || isNaN(stringValue);
        if (!$scope.tokensAmountError) {
            $scope.totalSupply = {
                tokens: holdersSum.round(2).toString(10)
            };
            $timeout(function() {
                $scope.dataChanged();
                $scope.$apply();
            });
        }
    };
    $scope.dataChanged = function() {
        $scope.chartData = angular.copy($scope.token_holders);
        $scope.chartOptions.updater ? $scope.chartOptions.updater() : false;
    };
    $scope.chartOptions = {
        itemValue: 'amount',
        itemLabel: 'address'
    };

    $scope.chartData = [];


    $scope.onChangeDateOfRecipient = function(path, value) {
        $scope.token_holders.filter(function(holder) {
            return holder.freeze_date === value;
        })[0]['parsed_freeze_date'] = value.format('X') * 1;
    };

    $scope.resetFormData = function() {
        $scope.request = angular.copy(contract.contract_details);
        $scope.contractName = contract.name;
        $scope.minStartDate = moment();
        $scope.token_holders = angular.copy($scope.request.token_holders);
        var powerNumber = new BigNumber('10').toPower($scope.request.decimals || 0);
        $scope.token_holders.map(function(holder) {
            holder.isFrozen = !!holder.freeze_date;
            holder.freeze_date = holder.freeze_date ? moment(holder.freeze_date * 1000) : $scope.minStartDate;
            if (holder.amount) {
                holder.amount = new BigNumber(holder.amount).div(powerNumber).toString(10);
            }
            holder.parsed_freeze_date = holder.freeze_date.format('X') * 1;
        });
        $scope.request.future_minting = $scope.request.future_minting || !$scope.token_holders.length;
    };



    var storage = window.localStorage || {};
    $scope.createContract = function() {
        var isWaitingOfLogin = $scope.checkUserIsGhost();
        if (!isWaitingOfLogin) {
            delete storage.draftContract;
            createContract();
            return;
        }
        storage.draftContract = JSON.stringify(generateContractData());
        isWaitingOfLogin.then(function() {
            checkDraftContract(true)
        });
        return true;
    };

    var generateContractData = function() {
        $scope.request.token_holders = [];
        var powerNumber = new BigNumber('10').toPower($scope.request.decimals || 0);
        $scope.token_holders.map(function(holder, index) {
            $scope.request.token_holders.push({
                freeze_date: holder.isFrozen ? holder.freeze_date.add(1, 'seconds').format('X') * 1 : null,
                amount: new BigNumber(holder.amount).times(powerNumber).toString(10),
                address: holder.address,
                name: holder.name || null
            });
        });

        var contractDetails = angular.copy($scope.request);
        contractDetails.decimals = contractDetails.decimals * 1;

        return {
            name: $scope.request.token_name,
            network: contract.network,
            contract_type: CONTRACT_TYPES_CONSTANTS.TOKEN,
            contract_details: contractDetails,
            id: contract.id
        };
    };

    var contractInProgress = false;
    var createContract = function() {
        if (contractInProgress) return;
        contractInProgress = true;

        var data = generateContractData();

        contractService[!$scope.editContractMode ? 'createContract' : 'updateContract'](data).then(function(response) {
            $state.go('main.contracts.preview.byId', {id: response.data.id});
        }, function(data) {
            switch(data.status) {
                case 400:
                    switch(data.data.result) {
                        case '1':
                        case 1:
                            $rootScope.commonOpenedPopup = 'errors/contract_date_incorrect';
                            break;
                        case '2':
                        case 2:
                            $rootScope.commonOpenedPopup = 'errors/contract_freeze_date_incorrect';
                            break;
                    }
                    break;
            }
            contractInProgress = false;
        });
    };
    $scope.editContractMode = !!contract.id;


    var checkDraftContract = function(redirect) {
        if (localStorage.draftContract) {
            if (!contract.id) {
                var draftContract = JSON.parse(localStorage.draftContract);
                if (draftContract.contract_type == CONTRACT_TYPES_CONSTANTS.TOKEN) {
                    contract = draftContract;
                }
            }
        }
        $scope.resetFormData();
        if (localStorage.draftContract && !contract.id && !$rootScope.currentUser.is_ghost) {
            $scope.createContract();
        } else if (redirect && !localStorage.draftContract) {
            $state.go('main.contracts.list');
        }
    };
    checkDraftContract();
    $scope.checkTokensAmount();

});
