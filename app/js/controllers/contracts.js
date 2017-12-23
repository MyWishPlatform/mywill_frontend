angular.module('app').controller('contractsController', function(contractService, CONTRACT_STATUSES_CONSTANTS, $rootScope, authService,
                                                                 contractsList, $scope, $state, $filter, $timeout) {

    $scope.stateData  = $state.current.data;
    $scope.statuses = CONTRACT_STATUSES_CONSTANTS;
    $scope.openedContract = false; //openedContract.data;
    $scope.contractsList = contractsList.data;
    var serverDateTime = contractsList.headers ? contractsList.headers('date') : false;
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


    var payContract = function(contract) {
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
                confirmPayment: function() {
                    if (contract.isDeployProgress) return;
                    contract.isDeployProgress = true;
                    contractService.deployContract(contract.id).then(function() {
                        contract.isDeployProgress = false;
                        $scope.returnToList();
                    }, function() {
                        contract.isDeployProgress = false;
                    })
                },
                contractCost: new BigNumber(contract.cost).div(Math.pow(10, 18)).toString(10)
            };
            $rootScope.commonOpenedPopup = 'contract-confirm-pay';
            console.log($rootScope.commonOpenedPopupParams);
        }, function() {
            contract.isDeployProgress = false;
        });
    };


    var contractTimer = false;
    var convertContract = function() {
        var checkInterval = durationList.filter(function(check) {
            return !($scope.openedContract.contract_details.check_interval % (check.value * 24 * 3600));
        })[0];

        $scope.openedContract.contract_details.check_interval = {
            period: $scope.openedContract.contract_details.check_interval / (checkInterval.value * 24 * 3600),
            periodUnit: checkInterval.name
        };
        $scope.openedContract.stateValue = $scope.statuses[$scope.openedContract.state]['value'];
        $scope.openedContract.stateTitle = $scope.statuses[$scope.openedContract.state]['title'];
        $scope.openedContract.myWillCode = JSON.stringify($scope.openedContract.abi);
        $scope.openedContract.copied = {};
        $scope.openedContract.balance = ($scope.openedContract.balance / Math.pow(10, 18)).toFixed(5);
        $scope.openedContract.visibleCost = new BigNumber($scope.openedContract.cost).div(Math.pow(10, 18)).round(2).toString(10);

        var type;
        switch($scope.openedContract.contract_type) {
            case 0:
                $scope.openedContract.contractTpl = 'lastwill';
                break;
            case 1:
                $scope.openedContract.contractTpl = 'lostkey';
                break;
            case 2:
                $scope.openedContract.contractTpl = 'deferred';
                break;
            case 3:
                var startTimer = function() {
                    contractTimer ? $timeout.cancel(contractTimer) : false;
                    var leftTime = Math.round((rightTime - ((new Date()).getTime() - startTime))/1000);
                    leftTime = Math.max(leftTime, 0);
                    var minutes = Math.floor(leftTime / 60);
                    minutes = ((minutes < 10) ? '0' : '') + minutes;
                    var seconds = leftTime % 60;
                    seconds = ((seconds < 10) ? '0' : '') + seconds;
                    $scope.openedContract.timer = minutes + ':' + seconds;
                    if (leftTime) {
                        contractTimer = $timeout(startTimer, 100);
                    }
                };
                $scope.openedContract.contractTpl = 'shopping';
                $scope.openedContract.contract_details.dueDate = (new Date($scope.openedContract.created_date)).getTime() + $scope.openedContract.contract_details.timeout * 1000;
                var rightTime = $scope.openedContract.contract_details.timeout * 1000 - ((new Date(serverDateTime).getTime() - (new Date($scope.openedContract.created_date)).getTime()));

                var startTime = (new Date()).getTime();

                startTimer();
                break;
            case 4:
                $scope.openedContract.contractTpl = 'crowdsale';
                $scope.openedContract.chartData = angular.copy($scope.openedContract.contract_details.token_holders);
                $scope.openedContract.chartData.unshift({
                    amount: $scope.openedContract.contract_details.hard_cap,
                    address: 'For Sale'
                });

                var holdersSum = $scope.openedContract.contract_details.token_holders.reduce(function (val, item) {
                    var value = new BigNumber(item.amount || 0);
                    return value.plus(val);
                }, new BigNumber(0));

                var ethSum = holdersSum.plus($scope.openedContract.contract_details.hard_cap);
                $scope.openedContract.totalSupply = {
                    eth: ethSum.div($scope.openedContract.contract_details.rate).round(2).toString(10),
                    tokens: ethSum.round(2).toString(10)
                };

                $scope.openedContract.chartOptions = {
                    itemValue: 'amount',
                    itemLabel: 'address',
                    auto: true
                };
                break;
        }


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

    var setContractState = function(contract, state, callback) {
        contract.state = state;
        contract.stateValue = $scope.statuses[contract.state]['value'];
        contract.stateTitle = $scope.statuses[contract.state]['title'];
        contractService.patchParams(contract.id, {
            state: state
        }).then(function() {
            callback ? callback() : false;
        });
    };


    $scope.refreshInProgress = {};
    $scope.timeoutsForProgress = {};

    var setProgressTimeout = function(contract) {
        var contractId = contract.id;
        $scope.timeoutsForProgress[contractId] = $timeout(function() {
            if ($scope.refreshInProgress[contractId]) {
                setProgressTimeout(contract);
            } else {
                $scope.timeoutsForProgress[contractId] = false;
            }
        }, 1000);
    };

    $scope.refreshContract = function(contract) {
        var contractId = contract.id;
        if ($scope.refreshInProgress[contractId]) return;
        $scope.refreshInProgress[contractId] = true;
        setProgressTimeout(contract);
        contractService.getContract(contractId).then(function(response) {
            serverDateTime = response.headers('date');
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
            setContractState(contract, 'WAITING_FOR_PAYMENT', function() {
                $scope.returnToList();
            });
        },
        deleteContract: function(contract) {
            contractService.deleteContract(contract.id).then(function() {
                $scope.returnToList();
            });
        },
        refreshContract: $scope.refreshContract,
        payContract: payContract
    };

});

