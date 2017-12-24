angular.module('app').controller('contractsPreviewController', function($state, $scope, contractService, $rootScope, $timeout) {
    var deletingProgress = false;

    $scope.contract = false;

    var url = 'https://www.myetherwallet.com/?';
    var params = [
        'sendMode=ether'
    ];
    var depositUrl = url + params.join('&');
    var killUrl = url + params.join('&');

    $scope.setContract = function(contract) {
        $scope.contract = contract;
        if (!contract.contract_details.eth_contract) return;
        var depositParams = ['to=' + contract.contract_details.eth_contract.address, 'gaslimit=30000', 'value=0'];
        var killParams = ['to=' + contract.contract_details.eth_contract.address, 'data=0x41c0e1b5', 'gaslimit=40000', 'value=0'];
        contract.depositUrl = depositUrl + '&' + depositParams.join('&');
        contract.killUrl = killUrl + '&' + killParams.join('&');
        contract.willCode = JSON.stringify(contract.contract_details.eth_contract.abi||{});
    };

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

    $scope.successCodeCopy = function(contract, field) {
        contract.copied = contract.copied || {};
        contract.copied[field] = true;
        $timeout(function() {
            contract.copied[field] = false;
        }, 1000);
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

});
