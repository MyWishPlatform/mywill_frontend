angular.module('app').controller('eosBuytokensController', function($scope, $timeout, $rootScope, $filter, $state, exRate, APP_CONSTANTS, EOSService) {

    $scope.exRate = exRate.data;

    $scope.payDone = function() {
        $state.go($rootScope.currentUser.contracts ? 'main.contracts.list' : 'main.createcontract.types');
    };


    $scope.eosAccountAddress = $rootScope.currentUser.eos_address;

    // var widget = window['BRWidget'].init('bestrate-widget', '7bfe602c796d37df7c53bfecfb5e68bd');

    // widget.send({
    //     tokenWithdrawalWallet: $scope.eosAccountAddress,
    //     // returnWallet:  $scope.eosAccountAddress,
    //     email: $filter('isEmail')($rootScope.currentUser.username) ? $rootScope.currentUser.username : undefined
    // } , {}, {
    //     description: '6c02a87b634ee67907a7'//$rootScope.currentUser.memo
    // });
    //
    // console.log(JSON.stringify([{
    //     tokenWithdrawalWallet: $scope.eosAccountAddress,
    //     returnWallet:  $scope.eosAccountAddress
    // } , {}, {
    //     description: '6c02a87b634ee67907a7'//$rootScope.currentUser.memo
    // }]));

    /*
    // eoslynx.getAccountInfo('i5OQ2hnQj2SdeHJYTpix1Ou8ZFXeuCr6sAcgEqC7EYfdo6B', true, false, 'eosmywish').then(console.log);

    eoslynx.transfer(
        'i5OQ2hnQj2SdeHJYTpix1Ou8ZFXeuCr6sAcgEqC7EYfdo6B',
        $scope.eosAccountAddress,
        0.0001,
        'EOSISH',
        $rootScope.currentUser.memo
    ).then(response => {
        console.log(response);
    });
    */

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

}).controller('eosBuytokensEosController', function($scope) {
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
}).controller('eosBuytokensEosishController', function($scope) {
    $scope.formData = {};
});