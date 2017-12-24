angular.module('app').controller('contractsController', function(contractService, CONTRACT_STATUSES_CONSTANTS, $rootScope, authService,
                                                                 contractsList, $scope, $state, $interval, $timeout) {

    $scope.statuses = CONTRACT_STATUSES_CONSTANTS;
    $scope.stateData  = $state.current.data;

    $scope.contractsList = contractsList.data;


    var launchProgress = false;
    var launchContract = function(contract) {
        launchProgress = true;
        contractService.deployContract(contract.id).then(function() {
            launchProgress = false;
            $scope.refreshContract(contract);
        }, function() {
            launchProgress = false;
        });
    };
    $scope.payContract = function(contract) {
        if (contract.isDeployProgress) return;
        $rootScope.getCurrentUser().then(function() {
            if ($rootScope.currentUser.is_ghost) {
                $rootScope.commonOpenedPopup = 'ghost-user-alarm';
                return;
            }
            if (new BigNumber($rootScope.currentUser.balance).minus(new BigNumber(contract.cost)) < 0) {
                $rootScope.commonOpenedPopup = 'less-balance';
                return;
            }
            $rootScope.commonOpenedPopupParams = {
                contract: contract,
                confirmPayment: launchContract,
                contractCost: new BigNumber(contract.cost).div(Math.pow(10, 18)).toString(10)
            };
            $rootScope.commonOpenedPopup = 'contract-confirm-pay';
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
        if ($scope.refreshInProgress[contractId]) return;
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
        });
    };

    $scope.successCodeCopy = function(contract, field) {
        contract.copied = contract.copied || {};
        contract.copied[field] = true;
        $timeout(function() {
            contract.copied[field] = false;
        }, 1000);
    };

});

