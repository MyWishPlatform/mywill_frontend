angular.module('app').controller('lostKeyCreateController', function($scope, contractService, $timeout, $state, $rootScope,
                                                                     openedContract, $stateParams, $filter,
                                                                     CONTRACT_TYPES_CONSTANTS, web3Service) {

    $scope.request = {};
    $scope.listWalletActivity = [
        {
            value: 1,
            name: $filter('translate')('CONTRACTS.FORMS.LOST_KEY.FIELDS.WALLETS_ACTIVITY.LIST.ITEM_1')
        }
    ];
    $scope.durationList = [
        {
            value: 1,
            name: 'CONTRACTS.FORMS.DAY'
        }, {
            value: 30,
            name: 'CONTRACTS.FORMS.MONTH'
        }, {
            value: 365,
            name: 'CONTRACTS.FORMS.YEAR'
        }
    ];
    $scope.currencyList = [
        {
            value: 1,
            name: 'ETH'
        }, {
            value: 2,
            name: 'WEI'
        }
    ];

    $scope.hairsList = [{
        percentage: 100
    }];

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

    $scope.walletAddress = '';
    var balanceTimer;

    var contract = openedContract && openedContract.data ? openedContract.data : {
        name:  'MyLostKey' + ($rootScope.currentUser.contracts + 1),
        network: $stateParams.network,
        contract_details: {}
    };
    $scope.network = contract.network;

    web3Service.setProviderByNumber(contract.network);

    $scope.getBalance = function() {
        balanceTimer ? $timeout.cancel(balanceTimer) : false;
        balanceTimer = false;
        $scope.checkedBalance = false;
        if (!$scope.walletAddress) {
            return;
        }
        $scope.balanceInProgress = true;
        balanceTimer = $timeout(function() {
            web3Service.getBalance($scope.walletAddress).then(function(balance) {
                balance = new BigNumber(Web3.utils.fromWei(balance, 'ether')).toFixed(4);
                $scope.checkedBalance = isNaN(balance) ? false : balance;
                balanceTimer = false;
                $scope.balanceInProgress = false;
            })
        }, 500);
    };

    $scope.minDate = moment.tz('UTC').hour(12).startOf('h');
    $scope.dueDate = moment.tz('UTC').hour(12).startOf('h');

    $scope.onChangeDate = function(modelName, currentDate) {
        $scope.dueDate = currentDate;
    };

    $scope.checkPeriod = 1;

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

    var generateContractData = function() {
        return {
            name: $scope.contractName,
            id: contract.id,
            contract_type: CONTRACT_TYPES_CONSTANTS.LOST_KEY,
            network: contract.network,
            contract_details: {
                user_address: $scope.walletAddress,
                check_interval: $scope.checkPeriod * $scope.checkPeriodSelect * 3600 * 24,
                active_to: $scope.dueDate.format('YYYY-MM-DD 00:00'),
                heirs: angular.copy($scope.hairsList)
            }
        };
    };

    $scope.contractInProgress = false;
    var createContract = function(callback) {
        if ($scope.contractInProgress) return;
        var data = generateContractData();
        $scope.contractInProgress = true;
        contractService[!$scope.editContractMode ? 'createContract' : 'updateContract'](data).then(function(response) {
            $state.go('main.contracts.preview.byId', {id: response.data.id});
        }, function() {
            $scope.contractInProgress = false;
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

    $scope.checkTimeLimit = function() {
        $scope.checkedTimeLimit = $scope.checkPeriod * $scope.checkPeriodSelect;
    };

    $scope.resetForms = function() {
        $scope.contractName = contract.name;
        $scope.walletAddress = contract.contract_details.user_address;
        $scope.walletAddress ? $scope.getBalance() : false;
        $scope.checkedBalance = undefined;
        $scope.hairsList = contract.contract_details.heirs || [{
            percentage: 100
        }];


        var checkInterval = contract.contract_details.check_interval ? $scope.durationList.filter(function(check) {
            return !(contract.contract_details.check_interval % (check.value * 24 * 3600));
        }) : false;

        var lastCheckInterval = checkInterval ? checkInterval[checkInterval.length - 1] : false;
        $scope.checkPeriod = lastCheckInterval ? contract.contract_details.check_interval / (lastCheckInterval.value * 24 * 3600) : 1;
        $scope.checkPeriodSelect = lastCheckInterval ? lastCheckInterval.value : 1;

        $scope.dueDate = contract.contract_details.active_to ? moment(contract.contract_details.active_to) : moment.tz('UTC').add(1, 'days').hour(12).startOf('h');
        $scope.checkTimeLimit();
        $scope.hairPercentChange();
    };


    var checkDraftContract = function(redirect) {
        if (localStorage.draftContract && !contract.id) {
            if (!contract.id) {
                var draftContract = JSON.parse(localStorage.draftContract);
                if (draftContract.contract_type == CONTRACT_TYPES_CONSTANTS.LOST_KEY) {
                    contract = draftContract;
                }
            }
        }
        $scope.resetForms();
        $scope.getBalance();
        if (localStorage.draftContract && !contract.id && !$rootScope.currentUser.is_ghost) {
            $scope.createContract();
        } else if (redirect && !localStorage.draftContract) {
            $state.go('main.contracts.list');
        }
    };


    checkDraftContract();

    $scope.setWalletAddress = function() {
        $scope.walletAddress = $scope.testAddresses.ETH;
        $scope.getBalance();
    };

});
