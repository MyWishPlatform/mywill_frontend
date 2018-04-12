angular.module('app').controller('myWishActionsController', function($scope) {

    $scope.sendCancelRequest = function(contract) {
        console.log('Cancel', contract);
    };

    $scope.sendConfirmLive = function(contract) {
        console.log('Confirm live', contract);
    };

});