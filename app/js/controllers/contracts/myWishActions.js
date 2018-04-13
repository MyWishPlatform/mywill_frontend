angular.module('app').controller('myWishActionsController', function($scope, contractService) {

    var cancelProgress = false;
    $scope.sendCancelRequest = function(contract, cb) {
        if (cancelProgress) return;
        contractService.sendCancelContract({
            id: contract.id
        }).then(function() {
            cancelProgress = false;
            cb ? cb() : false;
        }, function() {
            cancelProgress = false;
        });
    };

    var iAmAliveProgress = false;
    $scope.sendConfirmLive = function(contract, cb) {
        if (iAmAliveProgress) return;
        contractService.sendIAmAlive({
            id: contract.id
        }).then(function() {
            iAmAliveProgress = false;
            cb ? cb() : false;
        }, function() {
            iAmAliveProgress = false;
        });
    };

});