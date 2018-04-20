angular.module('app').controller('myWishActionsController', function($scope, contractService, $rootScope) {

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
    $scope.isOkAlive = function(contract) {
        var lastAccessedDate = moment($rootScope.getNowDateTime()).add(-1, 'days');
        var lastPressIAlive = contract.contract_details.last_press_imalive ? moment(contract.contract_details.last_press_imalive) : false;
        return !lastPressIAlive || (lastAccessedDate > lastPressIAlive);
    };

    $scope.sendConfirmLive = function(contract, cb) {
        if (iAmAliveProgress) return;

        $rootScope.commonOpenedPopup = 'errors/frequent-call-ialive';
        contractService.sendIAmAlive({
            id: contract.id
        }).then(function() {
            iAmAliveProgress = false;
            cb ? cb() : false;
        }, function(data) {
            switch (data.data.detail) {
                case "3000":
                case 3000:
                    $rootScope.commonOpenedPopup = 'errors/frequent-call-ialive';
                    break;
            }
            iAmAliveProgress = false;
        });
    };

});