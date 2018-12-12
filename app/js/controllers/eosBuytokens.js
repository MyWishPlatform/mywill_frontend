angular.module('app').controller('eosBuytokensController', function($scope, $timeout, $rootScope, $filter, $state,
                                                                    exRate, APP_CONSTANTS, $location) {

    $scope.exRate = exRate.data;
    $scope.payDone = function() {
        $state.go($rootScope.currentUser.contracts ? 'main.contracts.list' : 'main.createcontract.types');
    };

    $scope.eosAccountAddress = $rootScope.currentUser.eos_address;


    if (window['BRWidget'] && !$rootScope.eoslynx) {
        $timeout(function() {
            var widget = window['BRWidget'].init('bestrate-widget', '8ce55c6765e822cec89307052be65c50');
            widget.send({
                tokenWithdrawalWallet: $scope.eosAccountAddress,
                email: $filter('isEmail')($rootScope.currentUser.username) ? $rootScope.currentUser.username : undefined
            } , {}, {
                description: $rootScope.currentUser.memo
            });
        });
    }

    var resetForm = function() {
        $scope.formData = {
            toAddress: $rootScope.currentUser.internal_address,
            toBtcAddress: $rootScope.currentUser.internal_btc_address,
            wishAddress: APP_CONSTANTS.WISH.ADDRESS
        };
    };

    resetForm();

    $scope.visibleForm = false;

    $scope.$watch('visibleForm', function() {
        resetForm();
    });

}).controller('eosBuytokensEosController', function($scope, $rootScope) {

    var rate = $scope.exRate.EOS;

    $scope.checkWishesAmount = function() {
        var wishesAmount = new BigNumber($scope.formData.eosAmount || 0);
        $scope.formData.wishesAmount  = wishesAmount.div(rate).round(2).toString(10);
        $scope.formData.amount = $scope.formData.ethAmount;
    };

    $scope.checkEosAmount = function() {
        if (!$scope.formData.wishesAmount) return;
        var ethAmount = new BigNumber($scope.formData.wishesAmount);
        $scope.formData.eosAmount = ethAmount.times(rate).round(2).toString(10);
        $scope.formData.amount = $scope.formData.ethAmount;
    };

    $scope.successLynxTransaction = function() {
        if (!$rootScope.eoslynxIsMobile) {
            if (window['eoslynx']) {
                window['eoslynx'].transfer(
                    'i5OQ2hnQj2SdeHJYTpix1Ou8ZFXeuCr6sAcgEqC7EYfdo6B',
                    $scope.eosAccountAddress,
                    new BigNumber($scope.formData.eosAmount).toFormat(4),
                    'EOS',
                    $rootScope.currentUser.memo
                ).then(function(response) {
                    console.log(response);
                });
            }
        } else {
            window['lynxMobile']['eosTransfer']({
                toAccount: $scope.eosAccountAddress,
                amount: new BigNumber($scope.formData.eosAmount).toFormat(4).toString(10),
                memo: $rootScope.currentUser.memo
            }).then(function(response) {
                // alert(JSON.stringify(response));
            }, function(response) {
                // alert(JSON.stringify(response));
            })
        }
    };
}).controller('eosBuytokensEosishController', function($scope, $rootScope) {
    $scope.formData = {};
    $scope.successEosishLynxTransaction = function() {
        if ($rootScope.eoslynxIsMobile) {
            window['lynxMobile']['transfer']({
                toAccount: $scope.eosAccountAddress,
                amount: new BigNumber($scope.formData.eosishAmount).toFormat(4).toString(10),
                memo: $rootScope.currentUser.memo,
                contract: 'buildertoken',
                symbol: "EOSISH"
            }).then(function(response) {
                // alert(JSON.stringify(response));
            }, function(response) {
                // alert(JSON.stringify(response));
            })
        }
    };
});




