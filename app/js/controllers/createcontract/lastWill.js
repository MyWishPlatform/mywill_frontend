angular.module('app').controller('lastWillCreateController', function($scope, contractService, $timeout, $state, $rootScope, NETWORKS_TYPES_NAMES_CONSTANTS,
                                                                      CONTRACT_TYPES_CONSTANTS, openedContract, $stateParams, web3Service, $filter) {


    $scope.durationList = [
        {
            value: 1,
            name: 'day'
        }, {
            value: 30,
            name: 'month'
        }, {
            value: 365,
            name: 'year'
        }
    ];

    $scope.hairsList = [];

    $scope.addHair = function() {

        var mod = 100 % $scope.hairsList.length;
        var oneHair = 100 / $scope.hairsList.length;
        var newHairMod = 100 % ($scope.hairsList.length + 1);
        var newOneHair = 100 / ($scope.hairsList.length + 1);
        var sum = 0;

        var oldSecondsValue = Math.floor(oneHair);
        var oldFirstValue = oldSecondsValue + mod;
        var newSecondsValue = Math.floor(newOneHair);
        var newFirstValue = newSecondsValue + newHairMod;

        $scope.hairsList.map(function(hair, ind) {
            switch (ind) {
                case 0:
                    hair.percentage = (hair.percentage !== oldFirstValue) ? hair.percentage : newFirstValue;
                    break;
                default:
                    hair.percentage = (hair.percentage !== oldSecondsValue) ? hair.percentage : newSecondsValue;
                    break;
            }
            sum+= hair.percentage;
        });
        $scope.hairsList.push({percentage: Math.max(0, 100 - sum)});
    };
    $scope.removeHair = function(hair) {
        var currentList = $scope.hairsList.filter(function(h) {
            return h != hair;
        });
        if (currentList.length === 1) {
            currentList[0].percentage = 100;
        }
        $scope.hairsList = currentList;
        $scope.hairPercentChange();
    };

    $scope.minDate = moment.tz('UTC').hour(12).startOf('h');

    var defaultDueDate = moment.tz('UTC').hour(12).startOf('h').add(5, 'years');
    $scope.dueDate = defaultDueDate.clone();

    $scope.onChangeDate = function(modelName, currentDate) {
        $scope.dueDate = currentDate;
    };

    $scope.checkPeriod = 1;

    var contract = openedContract && openedContract.data ? openedContract.data : {
        name:  'MyWill' + ($rootScope.currentUser.contracts + 1),
        network: $stateParams.network || 1,
        contract_details: {
            check_interval: 180 * 24 * 3600,
            email: $filter('isEmail')($rootScope.currentUser.username) ? $rootScope.currentUser.username : undefined
        }
    };

    $scope.networkName = ((contract.network == 1) || (contract.network == 2)) ? 'ETH' :
        ((contract.network == 3) || (contract.network == 4)) ? 'RSK' : 'Unknown';


    $scope.network = {
        name: NETWORKS_TYPES_NAMES_CONSTANTS[contract.network],
        id: contract.network
    };

    var generateContractData = function() {
        return {
            name: $scope.contractName,
            id: contract.id,
            contract_type: CONTRACT_TYPES_CONSTANTS.LAST_WILL,
            network: contract.network,
            contract_details: {
                platform_cancel: $scope.request.platform_cancel,
                platform_alive: $scope.request.platform_alive,
                user_address: $scope.request.user_address,
                email: $scope.request.email,
                check_interval: $scope.checkPeriod * $scope.checkPeriodSelect * 3600 * 24,
                active_to: $scope.dueDate.format('YYYY-MM-DD 00:00'),
                heirs: angular.copy($scope.hairsList)
            }
        }
    };


    $scope.editContractMode = !!contract.id;

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


    var contractInProgress = false;
    var createContract = function(callback) {
        if (contractInProgress) return;
        var data = generateContractData();
        contractInProgress = true;
        contractService[!$scope.editContractMode ? 'createContract' : 'updateContract'](data).then(function(response) {
            callback ? callback() : $state.go('main.contracts.preview.byId', {id: response.data.id});
        }, function() {
            contractInProgress = false;
        });
    };

    $scope.hairPercentChange = function() {
        var sum = $scope.hairsList.reduce(function(acc, elem) {
            acc+= elem.percentage;
            return acc;
        }, 0);
        $scope.percentageSum = sum;
        $scope.percentageStatus = sum > 100 ? 0 : (sum < 100 ? 1 : 2);
    };
    $scope.resetForms = function() {
        $scope.request = angular.copy(contract.contract_details);

        $scope.contractName = contract.name;
        $scope.hairsList = contract.contract_details.heirs ? angular.copy(contract.contract_details.heirs) : [];

        var checkInterval = contract.contract_details.check_interval ? $scope.durationList.filter(function(check) {
            return !(contract.contract_details.check_interval % (check.value * 24 * 3600));
        }) : false;

        var lastCheckInterval = checkInterval ? checkInterval[checkInterval.length - 1] : false;

        $scope.checkPeriod = lastCheckInterval ? contract.contract_details.check_interval / (lastCheckInterval.value * 24 * 3600) : 1;
        $scope.checkPeriodSelect = lastCheckInterval ? lastCheckInterval.value : 1;

        $scope.dueDate = contract.contract_details.active_to ? moment(contract.contract_details.active_to) : defaultDueDate.clone();

        $scope.hairPercentChange();
    };


    $scope.balanceInProgress = false;
    $scope.checkedBalance = false;
    $scope.mainForm = false;

    web3Service.setProviderByNumber(contract.network);
    $scope.checkBalance = function() {
        if (!$scope.mainForm.$valid) return;
        $scope.balanceInProgress = true;
        web3Service.getBalance($scope.request.user_address).then(function(data) {
            $scope.balanceInProgress = false;
            $scope.checkedBalance = Web3.utils.fromWei(data, 'ether');
        }, function() {
            $scope.balanceInProgress = false;
        });
    };

    var checkDraftContract = function(redirect) {
        if (localStorage.draftContract && !contract.id) {
            if (!contract.id) {
                var draftContract = JSON.parse(localStorage.draftContract);
                if (draftContract.contract_type == CONTRACT_TYPES_CONSTANTS.LAST_WILL) {
                    contract = draftContract;
                }
            }
        }
        $scope.resetForms();
        $scope.checkBalance();
        if (localStorage.draftContract && !contract.id && !$rootScope.currentUser.is_ghost) {
            $scope.createContract();
        } else if (redirect && !localStorage.draftContract) {
            $state.go('main.contracts.list');
        }
    };


    checkDraftContract();


});
