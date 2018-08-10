angular.module('app').controller('eosBuytokensController', function($scope, $timeout, $rootScope, $state, exRate, APP_CONSTANTS, EOSService) {

    $scope.exRate = exRate.data;
    $scope.wallets = {metamask: [], parity: []};

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

    var rate = $scope.exRate.ETH;

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


    EOSService.createEosChain(10);

    $scope.user_address = '';
    var checkAddressTimeout;
    $scope.userBalance = '';

    $scope.wishAddress = EOSService.getMywishAddress(10);

    $scope.checkAddress = function(addressField) {
        $scope.checkedAddress = false;
        addressField.$setValidity('check-sum', true);
        addressField.$setValidity('not-checked', true);
        if (!addressField.$valid) return;
        addressField.$setValidity('not-checked', false);
        if (!addressField.$viewValue) {
            return;
        }

        $scope.userBalance = false;

        checkAddressTimeout ? $timeout.cancel(checkAddressTimeout) : false;
        checkAddressTimeout = $timeout(function() {
            EOSService.checkAddress(addressField.$viewValue).then(function(addressInfo) {
                addressField.$setValidity('not-checked', true);
                $scope.checkedAddress = true;
                EOSService.getBalance('eosio.token', addressField.$viewValue, 'EOS').then(function(result) {
                    $scope.userBalance = result.length ? result[0].split(' ')[0] : '0';
                });
            }, function() {
                addressField.$setValidity('check-sum', false);
            });
        }, 500);
    };


});