angular.module('app').controller('contractsPreviewController', function($state, $scope, contractService, $rootScope) {
    var deletingProgress = false;

    $scope.contract = false;
    $scope.setContract = function(contract) {
        $scope.contract = contract;
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
