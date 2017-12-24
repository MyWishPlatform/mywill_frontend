angular.module('app').controller('contractsController', function(contractService, CONTRACT_STATUSES_CONSTANTS, $rootScope, authService,
                                                                 contractsList, $scope, $state, $interval) {

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

    // var convertContract = function() {
    //     var checkInterval = durationList.filter(function(check) {
    //         return !($scope.openedContract.contract_details.check_interval % (check.value * 24 * 3600));
    //     })[0];
    //     $scope.openedContract.contract_details.check_interval = {
    //         period: $scope.openedContract.contract_details.check_interval / (checkInterval.value * 24 * 3600),
    //         periodUnit: checkInterval.name
    //     };
    //     $scope.openedContract.stateValue = $scope.statuses[$scope.openedContract.state]['value'];
    //     $scope.openedContract.stateTitle = $scope.statuses[$scope.openedContract.state]['title'];
    //     $scope.openedContract.myWillCode = JSON.stringify($scope.openedContract.abi);
    //     $scope.openedContract.copied = {};
    //     $scope.openedContract.balance = ($scope.openedContract.balance / Math.pow(10, 18)).toFixed(5);
    //     $scope.openedContract.visibleCost = new BigNumber($scope.openedContract.cost).div(Math.pow(10, 18)).round(2).toString(10);
    //
    //     var url = 'https://www.myetherwallet.com/?';
    //     var params = [
    //         'sendMode=ether'
    //     ];
    //
    //     var payUrl = url + params.join('&');
    //     var depositUrl = url + params.join('&');
    //     var killUrl = url + params.join('&');
    //
    //     var payParams = ['to='+$scope.openedContract.owner_address, 'gaslimit=30000', 'value=' + $scope.openedContract.cost];
    //     var depositParams = ['to='+$scope.openedContract.address, 'gaslimit=30000', 'value=0'];
    //     var killParams = ['to='+$scope.openedContract.address, 'data=0x41c0e1b5', 'gaslimit=40000', 'value=0'];
    //
    //     $scope.openedContract.payUrl = payUrl + '&' + payParams.join('&');
    //     $scope.openedContract.depositUrl = payUrl + '&' + depositParams.join('&');
    //     $scope.openedContract.killUrl = killUrl + '&' + killParams.join('&');
    // };

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

});

