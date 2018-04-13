angular.module('app').controller('myWishActionsController', function($scope, contractService) {

    var cancelProgress = false;
    $scope.sendCancelRequest = function(contract) {
        if (cancelProgress) return;
        contractService.sendCancelContract({
            id: contract.id
        }).then(function() {
            cancelProgress = false;
        }, function() {
            cancelProgress = false;
        });
    };

    var iAmAliveProgress = false;
    $scope.sendConfirmLive = function(contract) {
        if (iAmAliveProgress) return;
        contractService.sendIAmAlive({
            id: contract.id
        }).then(function() {
            iAmAliveProgress = false;
        }, function() {
            iAmAliveProgress = false;
        });
    };

});