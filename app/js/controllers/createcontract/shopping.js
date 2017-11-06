angular.module('app').controller('shoppingCreateController', function(contractService, $scope, $timeout, CONTRACT_TYPES_CONSTANTS, $stateParams, $rootScope, $state) {


    var contractOptions = JSON.parse($stateParams.options);
    $scope.walletAddress = '';
    var balanceTimer, pizzaCost, contractCost;

    var getFullAmount = function() {
        contractService.getExchange().then(function(response) {
            var exchange = response.data['RUB'];
            var checkedAmount = contractOptions['price'] / exchange;
            pizzaCost = checkedAmount * $rootScope.weiDelta;
            contractService.getCost({
                contract_type: 3,
                pizza_cost: pizzaCost
            }).then(function(response) {
                contractCost = response.data.result / $rootScope.weiDelta;
                $scope.checkedAmount = Math.ceil((contractCost + checkedAmount) * 1000) / 1000;
            });
        })
    };


    getFullAmount();

    $scope.getBalance = function() {
        balanceTimer ? $timeout.cancel(balanceTimer) : false;
        balanceTimer = false;
        $scope.checkedBalance = false;
        if (!$scope.walletAddress) {
            return;
        }
        $scope.balanceInProgress = true;
        balanceTimer = $timeout(function() {
            contractService.getBalance($scope.walletAddress).then(function(response) {
                var balance = (response.data.result / Math.pow(10, 18)).toFixed(5);
                $scope.checkedBalance = isNaN(balance) ? false : balance;
                balanceTimer = false;
                $scope.balanceInProgress = false;
            })
        }, 500);
    };

    var contractInProgress = false;
    $scope.createContract = function(e) {
        e.preventDefault();
        var openedWindow = window.open('', "_blank");
        if (contractInProgress) return;
        var data = {
            contract_type: CONTRACT_TYPES_CONSTANTS.SHOPPING,
            contract_details: {
                user_address: $scope.walletAddress,
                pizza_cost: pizzaCost,
                order_id: contractOptions.order
            }
        };
        contractInProgress = true;
        contractService.createContract(data).then(function(response) {
            var contract = response.data;
            contractInProgress = false;
            openedWindow.location.href = "https://www.myetherwallet.com/?sendMode=ether&to="+ contract['owner_address'] +"&gaslimit=30000&value=" + contractCost;
            console.log(contract);
            $state.go('main.contracts.preview', {id: contract.id});
        }, function(response) {
            contractInProgress = false;
            openedWindow.close();
        });

    };


    $scope.previewContractPopUp = {
        // createContract: createContract,
        // goToLogin: goToLogin,
        // goToRegistration: goToRegistration,
        // successCodeCopy: successCodeCopy,
        // failCodeCopy: failCodeCopy
    };

});

