angular.module('app').controller('joinAirdropController', function($scope, $timeout, EOSService) {

    var checkAddressTimeout;

    $scope.checkAddress = function(addressField) {
        addressField.$setValidity('not-checked', true);
        if (!addressField.$valid) return;
        addressField.$setValidity('not-checked', false);
        if (!addressField.$viewValue) {
            return;
        }
        checkAddressTimeout ? $timeout.cancel(checkAddressTimeout) : false;
        var address = addressField.$viewValue;
        checkAddressTimeout = $timeout(function() {
            EOSService.checkAddress(addressField.$viewValue, 10).then(function(addressInfo) {
                if (address !== addressField.$viewValue) return;
                addressField.$setValidity('not-checked', true);
            });
        }, 200);
    };
});