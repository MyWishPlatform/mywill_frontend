angular.module('app').controller('eosCrowdSaleCreateController', function(
    $scope, currencyRate, contractService, $location, APP_CONSTANTS, $stateParams,
    $filter, openedContract, $timeout, $state, $rootScope, CONTRACT_TYPES_CONSTANTS) {

    $scope.currencyRate = currencyRate.data;
    $scope.additionalParams = {};
    $scope.additionalParams.investsLimit = false;

    $scope.token = {};
    $scope.additionalParams = {
        havePublicKeys: true
    };

    var contract = openedContract && openedContract.data ? openedContract.data : {
        name:  'MyCrowdSale' + ($rootScope.currentUser.contracts + 1),
        network: $stateParams.network * 1,
        contract_details: {
            token_holders: []
        }
    };

    $scope.network = contract.network;
    
    $scope.currencyPow = 4;

    $scope.checkMaxTokenSupply = function() {
        $scope.maxSupply = 4611686018427387903 / Math.pow(10, $scope.request.decimals||0);
        checkTokensAmountTimeout ? $timeout.cancel(checkTokensAmountTimeout)  : false;
        checkTokensAmountTimeout = $timeout(function() {
            $scope.$broadcast('tokensCapChanged');
        }, 300);
    };

    /* Управление датой и временем начала/окончания ICO (begin) */
    var setStartTimestamp = function() {
        if (!$scope.dates.startDate) {
            $scope.dates.startDate = moment($scope.request.start_date * 1000);
        }
        $scope.dates.startDate.hours($scope.timesForStarting.start.hours).minutes($scope.timesForStarting.start.minutes);
        if ($scope.dates.startDate < $scope.minStartDate) {
            $scope.dates.startDate = $scope.minStartDate.clone();
        }
        $timeout(function() {
            $scope.request.start_date = $scope.dates.startDate.clone().hours($scope.timesForStarting.start.hours).minutes($scope.timesForStarting.start.minutes).format('X') * 1;
            $scope.$broadcast('pickerUpdate', ['start-date'], {});
        });
        $scope.$broadcast('icoTimesChanged');
    };
    var setStopTimestamp = function() {
        if (!$scope.dates.endDate) {
            $scope.dates.endDate = moment($scope.request.stop_date * 1000);
        }
        $scope.dates.endDate.hours($scope.timesForStarting.stop.hours).minutes($scope.timesForStarting.stop.minutes);
        if ($scope.dates.endDate < $scope.minStartDate) {
            $scope.dates.endDate = $scope.minStartDate.clone();
        }
        $timeout(function() {
            $scope.request.stop_date = $scope.dates.endDate.clone().hours($scope.timesForStarting.stop.hours).minutes($scope.timesForStarting.stop.minutes).format('X') * 1;
            $scope.$broadcast('pickerUpdate', ['end-date'], {});
        });
        $scope.$broadcast('icoTimesChanged');
    };

    $scope.onChangeStartTime = setStartTimestamp;
    $scope.onChangeStopTime = setStopTimestamp;
    $scope.onChangeStartDate = setStartTimestamp;
    $scope.onChangeEndDate = setStopTimestamp;

    var checkTokensAmountTimeout;
    $scope.checkTokensAmount = function() {
        checkTokensAmountTimeout ? $timeout.cancel(checkTokensAmountTimeout)  : false;
        checkTokensAmountTimeout = $timeout(function() {
            $scope.$broadcast('tokensCapChanged');
        }, 300);
    };
    $scope.checkHardCapEth = function() {
        var hard_cap = $scope.request.hard_cap || 0;
        $scope.additionalParams.ethHardCap = new BigNumber(hard_cap).div($scope.request.rate).decimalPlaces(2).toString(10);
        $scope.additionalParams.usdHardCap = $filter('number')(hard_cap / $scope.request.rate * $scope.currencyRate.USD, 2);
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
        var contractDetails = angular.copy($scope.request);

        contractDetails.eos_contract_crowdsale = undefined;

        contractDetails.rate = contractDetails.rate * 1;
        contractDetails.decimals = contractDetails.decimals * 1;
        contractDetails.start_date = contractDetails.start_date * 1;
        contractDetails.stop_date = contractDetails.stop_date * 1;

        contractDetails.token_short_name = contractDetails.token_short_name.toUpperCase();
        contractDetails.admin_address = contractDetails.admin_address.toLowerCase();
        contractDetails.crowdsale_address = contractDetails.crowdsale_address.toLowerCase();

        contractDetails.hard_cap = new BigNumber(contractDetails.hard_cap).times(Math.pow(10, contractDetails.decimals)).decimalPlaces().toString(10);

        if (contractDetails.soft_cap) {
            contractDetails.soft_cap = new BigNumber(contractDetails.soft_cap).times(Math.pow(10, contractDetails.decimals)).decimalPlaces().toString(10);
        }

        if (!$scope.additionalParams.investsLimit) {
            contractDetails.min_wei = null;
            contractDetails.max_wei = null;
        } else {
            contractDetails.min_wei = new BigNumber(contractDetails.min_wei).times(Math.pow(10,$scope.currencyPow)).decimalPlaces().toString(10);
            contractDetails.max_wei = new BigNumber(contractDetails.max_wei).times(Math.pow(10,$scope.currencyPow)).decimalPlaces().toString(10);
        }

        return {
            name: $scope.contractName,
            network: contract.network,
            contract_type: CONTRACT_TYPES_CONSTANTS.CROWDSALE_EOS,
            contract_details: contractDetails,
            id: contract.id
        };
    };

    /* Управление датой и временем начала/окончания ICO (end) */
    $scope.contractInProgress = false;
    var createContract = function() {
        if ($scope.contractInProgress) return;
        $scope.$broadcast('createContract');

        var data = generateContractData();
        $scope.contractInProgress = true;
        contractService[!$scope.editContractMode ? 'createContract' : 'updateContract'](data).then(function(response) {
            $state.go('main.contracts.preview.byId', {id: response.data.id});
        }, function(data) {
            switch(data.status) {
                case 400:
                    switch(data.data.result) {
                        case '1':
                        case 1:
                            $rootScope.commonOpenedPopupParams = {
                                newPopupContent: true
                            };
                            $rootScope.commonOpenedPopup = 'errors/contract_date_incorrect';
                            break;
                        case '2':
                        case 2:
                            $rootScope.commonOpenedPopupParams = {
                                newPopupContent: true
                            };
                            $rootScope.commonOpenedPopup = 'errors/contract_freeze_date_incorrect';
                            break;
                    }
                    break;
            }
            $scope.contractInProgress = false;
        });
    };
    $scope.editContractMode = !!contract.id;
    $scope.resetForms = function() {
        $scope.request = angular.copy(contract.contract_details);

        $timeout(function () {
            $scope.$broadcast('tokensCapChanged');
        });

        $scope.contractName = contract.name;
        $scope.minStartDate = moment();
        $scope.dates = {
            startDate: $scope.editContractMode ? moment(contract.contract_details.start_date * 1000) : $scope.minStartDate.clone().add(1, 'days'),
            endDate: $scope.editContractMode ? moment(contract.contract_details.stop_date * 1000) : $scope.minStartDate.clone().add(1, 'days').add(1, 'months')
        };
        $scope.minStartDate.add(5, 'minutes').second(0);
        $scope.timesForStarting = {
            start: {
                hours: $scope.dates.startDate.hours(),
                minutes: $scope.dates.startDate.minutes()
            },
            stop: {
                hours: $scope.dates.endDate.hours(),
                minutes: $scope.dates.endDate.minutes()
            }
        };

        $scope.additionalParams.investsLimit = !!contract.contract_details.min_wei;
        if ($scope.additionalParams.investsLimit) {
            $scope.request.min_wei = new BigNumber($scope.request.min_wei).div(Math.pow(10,$scope.currencyPow)).decimalPlaces(2).toString(10);
            $scope.request.max_wei = new BigNumber($scope.request.max_wei).div(Math.pow(10,$scope.currencyPow)).decimalPlaces(2).toString(10);
        }

        if ($scope.request.hard_cap) {
            $scope.request.hard_cap = new BigNumber($scope.request.hard_cap).div(Math.pow(10, $scope.request.decimals)).decimalPlaces().toString(10);
        }
        if ($scope.request.soft_cap) {
            $scope.request.soft_cap = new BigNumber($scope.request.soft_cap).div(Math.pow(10, $scope.request.decimals)).decimalPlaces().toString(10);
        }
        setStartTimestamp();
        setStopTimestamp();
        $scope.$broadcast('resetForm');
    };

    var checkDraftContract = function(redirect) {
        if (localStorage.draftContract && !contract.id) {
            if (!contract.id) {
                var draftContract = JSON.parse(localStorage.draftContract);
                if (draftContract.contract_type == CONTRACT_TYPES_CONSTANTS.CROWDSALE_EOS) {
                    contract = draftContract;
                }
            }
        }
        $scope.resetForms();
        if (localStorage.draftContract && !contract.id && !$rootScope.currentUser.is_ghost) {
            $scope.createContract();
        } else if (redirect && !localStorage.draftContract) {
            $state.go('main.contracts.list');
        }
    };
    checkDraftContract();

    if (contract.id) {
        $scope.checkHardCapEth();
    }

    $scope.checkPublicKey = function(keysForm, field) {
        keysForm[field].$setValidity('public-key', Eos.modules.ecc.isValidPublic(keysForm[field].$viewValue));
    };
    $scope.checkMaxTokenSupply();

}).controller('eosCrowdSaleHoldersController', function($scope, $timeout, $filter) {

    $scope.addRecipient = function() {
        $scope.token_holders.push({});
    };

    $scope.removeRecipient = function(recipient) {
        $scope.token_holders = $scope.token_holders.filter(function(rec) {
            return rec !== recipient;
        });
    };

    $scope.checkTokensAmount = function() {
        var holdersSum = $scope.token_holders.reduce(function (val, item) {
            var value = new BigNumber(item.amount || 0);
            return value.plus(val);
        }, new BigNumber(0));

        var stringValue = holdersSum.toString(10);

        $scope.tokensAmountError = isNaN($scope.request.hard_cap) || isNaN(stringValue) || isNaN($scope.request.rate);

        if (!$scope.tokensAmountError) {
            var ethSum = holdersSum.plus($scope.request.hard_cap);
            $scope.tokensAmountError = ethSum.minus($scope.maxSupply + '') > 0 ? 'maxSupply' : false;

            if ($scope.tokensAmountError) return;

            $scope.totalSupply = {
                eth: ethSum.div($scope.request.rate).decimalPlaces(2).toString(10),
                tokens: ethSum.round(2).toString(10)
            };
            $timeout(function() {
                $scope.dataChanged();
                $scope.$apply();
            });
        }
    };
    $scope.chartOptions = {
        itemValue: 'amount',
        itemLabel: 'address'
    };
    $scope.chartData = [];
    $scope.dataChanged = function() {
        $scope.chartData = angular.copy($scope.token_holders);
        $scope.chartData.unshift({
            amount: $scope.request.hard_cap,
            address: $filter('translate')('CONTRACTS.FOR_SALE')
        });
        $scope.chartOptions.updater ? $scope.chartOptions.updater() : false;
    };

    var resetFormData = function() {
        var powerNumber = new BigNumber('10').exponentiatedBy($scope.request.decimals || 0);
        $scope.token_holders = angular.copy($scope.request.token_holders);
        $scope.token_holders.map(function(holder) {
            holder.amount = new BigNumber(holder.amount).div(powerNumber).toString(10);
        });
    };
    var createdContractData = function() {
        var powerNumber = new BigNumber('10').exponentiatedBy($scope.request.decimals || 0);
        $scope.request.token_holders = [];
        $scope.token_holders.map(function(holder, index) {
            $scope.request.token_holders.push({
                amount: new BigNumber(holder.amount).times(powerNumber).toString(10),
                address: holder.address,
                name: holder.name || null
            });
        });
    };
    resetFormData();
    $scope.$on('resetForm', resetFormData);
    $scope.$on('createContract', createdContractData);
    $scope.$on('tokensCapChanged', $scope.checkTokensAmount);
});
