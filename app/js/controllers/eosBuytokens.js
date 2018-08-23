angular.module('app').controller('eosBuytokensController', function($scope, $timeout, $rootScope, $state, exRate, APP_CONSTANTS, EOSService) {

    $scope.exRate = exRate.data;

    var resetForm = function() {
        $scope.formData = {
            toAddress: $rootScope.currentUser.internal_address,
            toBtcAddress: $rootScope.currentUser.internal_btc_address,
            wishAddress: APP_CONSTANTS.WISH.ADDRESS
        };
    };

    resetForm();

    $scope.$watch('visibleForm', function() {
        resetForm();
    });

    $scope.payDone = function() {
        $state.go($rootScope.currentUser.contracts ? 'main.contracts.list' : 'main.createcontract.types');
    };

    var rate = $scope.exRate.EOS;

    $scope.checkWishesAmount = function() {
        var wishesAmount = new BigNumber($scope.formData.eosAmount || 0);
        $scope.formData.wishesAmount  = wishesAmount.div(rate).round(2).toString(10);
        $scope.formData.amount = $scope.formData.eosAmount;
    };
    $scope.checkEosAmount = function() {
        if (!$scope.formData.wishesAmount) return;
        var ethAmount = new BigNumber($scope.formData.wishesAmount);
        $scope.formData.eosAmount = ethAmount.times(rate).round(2).toString(10);
        $scope.formData.amount = $scope.formData.eosAmount;
    };


    $scope.closeScatterAlert = function() {
        $scope.scatterNotInstalled = false;
        $scope.accountNotFinded = false;
        $scope.mintServerError = false;
    };

    $scope.wishAddress = EOSService.getComingAddress();
    $scope.sendTransaction = function() {

        $scope.scatterNotInstalled = !EOSService.checkScatter();
        if ($scope.scatterNotInstalled) return;

        EOSService.createEosChain(10, function() {
            EOSService.buyTokens(
                new BigNumber($scope.formData.amount).toFormat(4).toString(10),
                $scope.currentUser.memo
            ).then(function(result) {
                $scope.successTransaction = result;
            }, function(error) {
                switch(error.code) {
                    case 1:
                        $scope.accountNotFinded = true;
                        break;
                    case 2:
                        $scope.mintServerError = true;
                        break;
                }
            });
        });
    };
});