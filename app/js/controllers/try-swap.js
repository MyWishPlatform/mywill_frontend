angular.module('app').controller('trySwapController', function($scope) {

    $scope.initSwapsWidget = function() {
        SwapsNetwork.init('swaps-network-widget', {
            onSubmit: function(result) {
                $scope.successSwapForm = true;
            }
        });
    };


});