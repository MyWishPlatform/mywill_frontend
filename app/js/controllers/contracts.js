angular.module('app').controller('contractsController', function(contractService, CONTRACT_STATUSES_CONSTANTS, $rootScope,
                                                                 contractsList, $scope, openedContract, $state, $filter, $timeout) {

    $scope.stateData  = $state.current.data;
    $scope.statuses = CONTRACT_STATUSES_CONSTANTS;
    $scope.openedContract = openedContract.data;
    $scope.contractsList = contractsList.data;
    var durationList = [
        {
            value: 365,
            name: 'years'
        }, {
            value: 30,
            name: 'months'
        }, {
            value: 1,
            name: 'days'
        }
    ];
    var copiedTimeouts = {};
    var successCodeCopy = function(contract, field) {
        contract.copied[field] = true;
        if (copiedTimeouts[contract.id] && copiedTimeouts[contract.id][field]) {
            $timeout.cancel(copiedTimeouts[contract.id][field]);
        }
        copiedTimeouts[contract.id] = copiedTimeouts[contract.id] || {};
        copiedTimeouts[contract.id][field] = $timeout(function() {
            contract.copied[field] = false;
        }, 3000);
    };

    var failCodeCopy = function() {};

    $scope.returnToList = function() {
        $state.transitionTo('main.contracts.list', {}, {
            reload: true, inherit: false, notify: true
        });
    };

    var convertContract = function() {
        $scope.openedContract.active_to = $filter('date')(new Date($scope.openedContract.active_to), 'yyyy-MM-dd');

        var checkInterval = durationList.filter(function(check) {
            return !($scope.openedContract.check_interval % (check.value * 24 * 3600));
        })[0];

        $scope.openedContract.check_interval = {
            period: $scope.openedContract.check_interval / (checkInterval.value * 24 * 3600),
            periodUnit: checkInterval.name
        };
        $scope.openedContract.cost = Math.ceil($scope.openedContract.cost / $rootScope.weiDelta * 100000) / 100000;
        $scope.openedContract.stateValue = $scope.statuses[$scope.openedContract.state]['value'];
        $scope.openedContract.stateTitle = $scope.statuses[$scope.openedContract.state]['title'];
        $scope.openedContract.myWillCode = JSON.stringify({abi: $scope.openedContract.abi, address: $scope.openedContract.address});
        $scope.openedContract.copied = {};
        $scope.openedContract.balance = ($scope.openedContract.balance / Math.pow(10, 18)).toFixed(5);


        var url = 'https://www.myetherwallet.com/?';
        var params = [
            'sendMode=ether'
        ];

        var payUrl = url + params.join('&');
        var depositUrl = url + params.join('&');
        var killUrl = url + params.join('&');

        var payParams = ['to='+$scope.openedContract.owner_address, 'gaslimit=30000', 'value=' + $scope.openedContract.cost];
        var depositParams = ['to='+$scope.openedContract.address, 'gaslimit=30000', 'value=0'];
        var killParams = ['to='+$scope.openedContract.address, 'data=0x41c0e1b5', 'gaslimit=40000', 'value=0'];

        $scope.openedContract.payUrl = payUrl + '&' + payParams.join('&');
        $scope.openedContract.depositUrl = payUrl + '&' + depositParams.join('&');
        $scope.openedContract.killUrl = killUrl + '&' + killParams.join('&');
    };


    if ($scope.openedContract) {
        convertContract();
    }

    $scope.previewContractPopUp = {
        successCodeCopy: successCodeCopy,
        failCodeCopy: failCodeCopy,
        createdContract: $scope.openedContract
    };

    var setContractState = function(contract, state) {
        contract.state = state;
        contract.stateValue = contract.stateValue = $scope.statuses[contract.state]['value'];
        contract.stateTitle = contract.stateValue = $scope.statuses[contract.state]['title'];
        contractService.patchParams(contract.id, {
            state: state
        });
    };


    $scope.refreshInProgress = {};

    $scope.refreshContract = function(contract) {
        var contractId = contract.id;
        if ($scope.refreshInProgress[contractId]) return;
        $scope.refreshInProgress[contractId] = true;
        contractService.getContract(contractId).then(function(response) {
            angular.merge(contract, response.data);
            if (contract === $scope.openedContract) {
                angular.merge(contract, response.data);
                convertContract();
            }
            $scope.refreshInProgress[contractId] = false;
        });
    };


    $scope.popupActions = {
        startChecking: function(contract) {
            setContractState(contract, 'WAITING_FOR_PAYMENT');
            $scope.returnToList();
        },
        deleteContract: function(contract) {
            contractService.deleteContract(contract.id).then(function() {
                $scope.returnToList();
            });
        },
        refreshContract: $scope.refreshContract
    };

});

