angular.module('app').controller('eosBuytokensController', function($scope, $timeout, $rootScope, $state, exRate, APP_CONSTANTS, EOSService) {

    $scope.exRate = exRate.data;

    $scope.payDone = function() {
        $state.go($rootScope.currentUser.contracts ? 'main.contracts.list' : 'main.createcontract.types');
    };

    $scope.eosAccountAddress = EOSService.getComingAddress();


    var resetForm = function() {
        $scope.formData = {
            toAddress: $rootScope.currentUser.internal_address,
            toBtcAddress: $rootScope.currentUser.internal_btc_address,
            wishAddress: APP_CONSTANTS.WISH.ADDRESS
        };
    };

    resetForm();

}).controller('eosBuytokensEosController', function($scope) {
    $scope.formData = {};
}).controller('eosBuytokensEosishController', function($scope) {
    $scope.formData = {};
});