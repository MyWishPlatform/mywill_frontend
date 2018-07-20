angular.module('app').controller('investmentPullCreateController', function($scope, contractService, $timeout, $state, $rootScope,
                                                                      CONTRACT_TYPES_CONSTANTS, openedContract, $stateParams, web3Service) {


    var contract = openedContract && openedContract.data ? openedContract.data : {
        name:  'MyInvestment' + ($rootScope.currentUser.contracts + 1),
        contract_type: CONTRACT_TYPES_CONSTANTS.INVESTMENT_PULL,
        network: $stateParams.network,
        contract_details: {
            platform_as_admin: false
        }
    };
    $scope.network = contract.network;

    $scope.editContractMode = !!contract.id;
    $scope.additionalParams = {};

    var resetForm = function() {
        $scope.request = angular.copy(contract);

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

        if ($scope.editContractMode) {

            $scope.additionalParams.tokenAddress = !!$scope.request.contract_details.token_address;
            $scope.additionalParams.investmentAddress = !!$scope.request.contract_details.investment_address;

            if ($scope.request.contract_details.min_wei) {
                $scope.additionalParams.investsLimit  = true;
                $scope.request.contract_details.min_wei = $rootScope.web3Utils.fromWei($scope.request.contract_details.min_wei, 'ether');
                $scope.request.contract_details.max_wei = $rootScope.web3Utils.fromWei($scope.request.contract_details.max_wei, 'ether');
            }
            $scope.request.contract_details.hard_cap = $rootScope.web3Utils.fromWei($scope.request.contract_details.hard_cap, 'ether');
            $scope.request.contract_details.soft_cap = $rootScope.web3Utils.fromWei($scope.request.contract_details.soft_cap, 'ether');
        }

        setStartTimestamp();
        setStopTimestamp();
    };

    $scope.resetForms = resetForm;

    var contractInProgress = false;

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
        if (contractInProgress) return;
        var data = angular.copy($scope.request);

        if ($scope.additionalParams.investsLimit) {
            data.contract_details.min_wei = $rootScope.web3Utils.toWei(data.contract_details.min_wei, 'ether');
            data.contract_details.max_wei = $rootScope.web3Utils.toWei(data.contract_details.max_wei, 'ether');
        }

        data.contract_details.hard_cap = $rootScope.web3Utils.toWei(data.contract_details.hard_cap, 'ether');
        data.contract_details.soft_cap = $rootScope.web3Utils.toWei(data.contract_details.soft_cap, 'ether');

        data.contract_details.token_address = $scope.additionalParams.tokenAddress ? data.contract_details.token_address : null;
        data.contract_details.investment_address = $scope.additionalParams.investmentAddress ? data.contract_details.investment_address : null;

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
                    }
                    break;
            }
            contractInProgress = false;
        });
    };

    var checkDraftContract = function(redirect) {
        if (localStorage.draftContract && !contract.id) {
            if (!contract.id) {
                var draftContract = JSON.parse(localStorage.draftContract);
                if (draftContract.contract_type == CONTRACT_TYPES_CONSTANTS.INVESTMENT_PULL) {
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


    /* Управление датой и временем начала/окончания ICO (begin) */
    var setStartTimestamp = function() {
        if (!$scope.dates.startDate) {
            $scope.dates.startDate = moment($scope.request.contract_details.start_date * 1000);
        }
        $scope.dates.startDate.hours($scope.timesForStarting.start.hours).minutes($scope.timesForStarting.start.minutes);
        if ($scope.dates.startDate < $scope.minStartDate) {
            $scope.dates.startDate = $scope.minStartDate.clone();
        }
        $timeout(function() {
            $scope.request.contract_details.start_date = $scope.dates.startDate.clone().hours($scope.timesForStarting.start.hours).minutes($scope.timesForStarting.start.minutes).format('X') * 1;
            $scope.$broadcast('pickerUpdate', ['start-date'], {});
        });
    };
    var setStopTimestamp = function() {
        if (!$scope.dates.endDate) {
            $scope.dates.endDate = moment($scope.request.contract_details.stop_date * 1000);
        }
        $scope.dates.endDate.hours($scope.timesForStarting.stop.hours).minutes($scope.timesForStarting.stop.minutes);
        if ($scope.dates.endDate < $scope.minStartDate) {
            $scope.dates.endDate = $scope.minStartDate.clone();
        }
        $timeout(function() {
            $scope.request.contract_details.stop_date = $scope.dates.endDate.clone().hours($scope.timesForStarting.stop.hours).minutes($scope.timesForStarting.stop.minutes).format('X') * 1;
            $scope.$broadcast('pickerUpdate', ['end-date'], {});
        });
    };
    $scope.onChangeStartTime = setStartTimestamp;
    $scope.onChangeStopTime = setStopTimestamp;
    $scope.onChangeStartDate = setStartTimestamp;
    $scope.onChangeEndDate = setStopTimestamp;


    checkDraftContract();


    $scope.checkTokenAddress = function() {
        $scope.tokenInfo = false;
        $scope.tokenAddressForm.token_address.$setValidity('contract-address', true);
        if (!$scope.tokenAddressForm.$valid) return;
        $scope.tokenAddressForm.token_address.$setValidity('required', false);
        web3Service.getTokenInfo(
            $scope.network,
            $scope.request.contract_details.token_address.toLowerCase(),
            false,
            ['decimals', 'symbol']
        ).then(function(result) {
            $scope.tokenAddressForm.token_address.$setValidity('required', true);
            if (!(result.symbol && result.decimals)) {
                $scope.tokenAddressForm.token_address.$setValidity('contract-address', false);
                return;
            }
            $scope.tokenAddressForm.token_address.$setValidity('contract-address', true);
            $scope.tokenInfo = result;
        });
    };

});
