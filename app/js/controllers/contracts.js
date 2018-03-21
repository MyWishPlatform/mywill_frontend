angular.module('app').controller('contractsController', function(contractService, CONTRACT_STATUSES_CONSTANTS, $rootScope, authService,
                                                                 contractsList, $scope, $state, $interval, $timeout) {

    $scope.statuses = CONTRACT_STATUSES_CONSTANTS;
    $scope.stateData  = $state.current.data;

    $scope.contractsList = contractsList.data;

    var launchProgress = false;
    var launchContract = function(contract) {
        if (launchProgress) return;
        launchProgress = true;
        contractService.deployContract(contract.id).then(function() {
            launchProgress = false;
            $scope.refreshContract(contract);
            $rootScope.closeCommonPopup();
        }, function(data) {
            switch(data.status) {
                case 400:
                    switch(data.data.result) {
                        case 1:
                            $rootScope.commonOpenedPopupParams = {};
                            $rootScope.commonOpenedPopup = 'contract_date_incorrect';
                            break;
                        case 2:
                            $rootScope.commonOpenedPopupParams = {};
                            $rootScope.commonOpenedPopup = 'contract_freeze_date_incorrect';
                            break;
                    }
                    break;
            }
            launchProgress = false;
        });
    };

    var showPriceLaunchContract = function(contract) {
        $rootScope.commonOpenedPopup = 'contract-confirm-pay';
        $rootScope.commonOpenedPopupParams = {
            class: 'deleting-contract',
            contract: contract,
            confirmPayment: launchContract,
            contractCost: new BigNumber(contract.cost).div(Math.pow(10, 18)).round(2).toString(10),
            withoutCloser: true
        };
    };

    $scope.payContract = function(contract) {
        if (contract.isDeployProgress) return;
        contract.discount = 0;
        $rootScope.getCurrentUser().then(function() {
            if ($rootScope.currentUser.is_ghost) {
                $rootScope.commonOpenedPopup = 'ghost-user-alarm';
                $rootScope.commonOpenedPopupParams = {};
                return;
            }
            if (new BigNumber($rootScope.currentUser.balance).minus(new BigNumber(contract.cost)) < 0) {
                $rootScope.commonOpenedPopup = 'less-balance';
                $rootScope.commonOpenedPopupParams = {};
                return;
            }

            $rootScope.commonOpenedPopupParams = {
                contract: contract,
                withoutCloser: true,
                class: 'conditions',
                actions: {
                    showPriceLaunchContract: showPriceLaunchContract
                }
            };
            $rootScope.commonOpenedPopup = 'conditions';
            contract.isDeployProgress = false;
        }, function() {
            contract.isDeployProgress = false;
        });
    };

    var deletingProgress;
    var updateList = function() {
        $rootScope.commonOpenedPopupParams = false;
        $rootScope.commonOpenedPopup = false;
        $state.transitionTo($state.current, {}, {
            reload: true,
            inherit: false,
            notify: true
        });

    };
    $scope.deleteContract = function(contract) {
        if (deletingProgress) return;
        deletingProgress = true;
        contractService.deleteContract(contract.id).then(function() {
            deletingProgress = false;
            updateList();
        }, function() {
            deletingProgress = false;
            updateList();
        });
    };

    var url = 'https://www.myetherwallet.com/?';
    var params = [
        'sendMode=ether'
    ];
    var depositUrl = url + params.join('&');
    var killUrl = url + params.join('&');

    $scope.iniContract = function(contract) {
        if (!contract.contract_details.eth_contract) return;
        var depositParams = ['to=' + contract.contract_details.eth_contract.address, 'gaslimit=30000', 'value=0'];
        var killParams = ['to=' + contract.contract_details.eth_contract.address, 'data=0x41c0e1b5', 'gaslimit=40000', 'value=0'];
        contract.depositUrl = depositUrl + '&' + depositParams.join('&');
        contract.killUrl = killUrl + '&' + killParams.join('&');
        contract.willCode = JSON.stringify(contract.contract_details.eth_contract.abi||{});
    };


    $scope.refreshInProgress = {};
    $scope.timeoutsForProgress = {};


    $scope.refreshContract = function(contract) {
        var contractId = contract.id;
        if ($scope.timeoutsForProgress[contractId]) return;
        $scope.refreshInProgress[contractId] = true;
        $scope.timeoutsForProgress[contractId] = $interval(function() {
            if (!$scope.refreshInProgress[contractId]) {
                $interval.cancel($scope.timeoutsForProgress[contractId]);
                $scope.timeoutsForProgress[contractId] = false;
            }
        }, 1000);
        contractService.getContract(contractId).then(function(response) {
            angular.merge(contract, response.data);
            $scope.refreshInProgress[contractId] = false;
        }, function() {
            $scope.refreshInProgress[contractId] = false;
        });
    };

    $scope.successCodeCopy = function(contract, field) {
        contract.copied = contract.copied || {};
        contract.copied[field] = true;
        $timeout(function() {
            contract.copied[field] = false;
        }, 1000);
    };

    $scope.goToContract = function(contract, $event) {
        var target = angular.element($event.target);
        if (target.is('.btn') || target.parents('.btn').length) return;
        $state.go('main.contracts.preview.byId', {id: contract.id});
    };


    $scope.$on('$userUpdated', updateList);

});
