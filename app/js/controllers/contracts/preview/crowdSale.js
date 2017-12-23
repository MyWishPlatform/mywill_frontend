angular.module('app').controller('crowdSalePreviewController', function($timeout, $rootScope, contractService, openedContract, $scope, exRate, CONTRACT_STATUSES_CONSTANTS, $state) {
    $scope.contract = openedContract.data;

    $scope.statuses = CONTRACT_STATUSES_CONSTANTS;

    var contractDetails = $scope.contract.contract_details;
    contractDetails.hard_cap_eth = new BigNumber(contractDetails.hard_cap).div(contractDetails.rate).round(2).toString(10);
    contractDetails.soft_cap_eth = new BigNumber(contractDetails.soft_cap).div(contractDetails.rate).round(2).toString(10);
    contractDetails.sources = {
        crowdsale: contractDetails.eth_contract_crowdsale.source_code || false,
        token: contractDetails.eth_contract_token.source_code || false
    };
    contractDetails.token_holders.map(function(holder) {
        holder.amount = new BigNumber(holder.amount).toString(10);
    });

    var holdersSum = contractDetails.token_holders.reduce(function (val, item) {
        var value = new BigNumber(item.amount || 0);
        return value.plus(val);
    }, new BigNumber(0));

    var ethSum = holdersSum.plus(contractDetails.hard_cap);
    $scope.totalSupply = {
        eth: ethSum.div(contractDetails.rate).round(2).toString(10),
        tokens: ethSum.round(2).toString(10)
    };


    $scope.chartOptions = {
        itemValue: 'amount',
        itemLabel: 'address'
    };
    $scope.chartData = angular.copy(contractDetails.token_holders);
    $scope.chartData.unshift({
        amount: contractDetails.hard_cap,
        address: 'For Sale'
    });

    $scope.stateValue = $scope.statuses[$scope.contract.state]['value'];
    $scope.stateTitle = $scope.statuses[$scope.contract.state]['title'];

    $scope.wishCost = exRate.data.WISH;

    var deletingProgress = false;
    $scope.deleteContract = function() {
        deletingProgress = true;
        contractService.deleteContract($scope.contract.id).then(function() {
            deletingProgress = false;
            $state.go('main.contracts.list');
        }, function() {
            deletingProgress = false;
        });
    };

    var launchProgress = false;
    var launchContract = function() {
        launchProgress = true;
        contractService.deployContract($scope.contract.id).then(function() {
            launchProgress = false;
            $state.go('main.contracts.list');
        }, function() {
            launchProgress = false;
        });
    };



    $scope.payContract = function() {
        var contract = $scope.contract;
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
                confirmPayment: launchContract,
                contractCost: new BigNumber(contract.cost).div(Math.pow(10, 18)).toString(10)
            };
            $rootScope.commonOpenedPopup = 'contract-confirm-pay';
            contract.isDeployProgress = false;
        }, function() {
            contract.isDeployProgress = false;
        });
    };

    $scope.successCodeCopy = function() {
        if ($scope.copiedCode) return;
        $scope.copiedCode = true;
        $timeout(function() {
            $scope.copiedCode = false;
        }, 2000);
    };
});
