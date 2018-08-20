angular.module('app').controller('eosCrowdSaleCreateController', function($scope, currencyRate, contractService, $location, APP_CONSTANTS, $stateParams,
                                                                       $filter, openedContract, $timeout, $state, $rootScope, CONTRACT_TYPES_CONSTANTS) {

    $scope.currencyRate = currencyRate.data;
    $scope.additionalParams = {};
    $scope.additionalParams.investsLimit = false;

    $scope.token = {};


    var contract = openedContract && openedContract.data ? openedContract.data : {
        name:  'MyCrowdSale' + ($rootScope.currentUser.contracts + 1),
        network: $stateParams.network * 1,
        contract_details: {}
    };

    $scope.network = contract.network;
    
    $scope.currencyPow = $scope.blockchain === 'NEO' ? 0 : 18;
    
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
        $scope.additionalParams.ethHardCap = new BigNumber(hard_cap).div($scope.request.rate).round(2).toString(10);
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

        return {
            name: $scope.contractName,
            network: contract.network,
            contract_type: CONTRACT_TYPES_CONSTANTS.CROWDSALE_EOS,
            contract_details: contractDetails,
            id: contract.id
        };
    };

    /* Управление датой и временем начала/окончания ICO (end) */
    var contractInProgress = false;
    var createContract = function() {
        if (contractInProgress) return;
        $scope.$broadcast('createContract');
        var data = generateContractData();
        contractInProgress = true;
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
            contractInProgress = false;
        });
    };
    $scope.editContractMode = !!contract.id;
    $scope.resetForms = function() {
        $scope.request = angular.copy(contract.contract_details);

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

        if ($scope.request.hard_cap) {
            $scope.request.hard_cap = new BigNumber($scope.request.hard_cap).times($scope.request.rate).div(Math.pow(10,$scope.currencyPow)).round().toString(10);
        }
        if ($scope.request.soft_cap) {
            $scope.request.soft_cap = new BigNumber($scope.request.soft_cap).times($scope.request.rate).div(Math.pow(10,$scope.currencyPow)).round().toString(10);
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

});
