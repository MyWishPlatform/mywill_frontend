angular.module('app').controller('trySwapController', function($scope, requestService) {

    $scope.showedTab = 'list';
    $scope.swapIsInit = false;

    $scope.iniSwapsList = function() {
        SwapsNetwork.drawOrdersList('orders-list');
    };


    $scope.iniSwapsForm = function() {
        SwapsNetwork.drawForm('swaps-network-widget', {
            onSubmit: function(result) {
                $scope.setTab('list');
                $scope.$apply();
            }
        });
    };


    var updateSessionToken = function() {
        return requestService.post({
            data: {
                origin: location.origin
            },
            path: 'generate_mywish_swap_token/',
            method: 'POST'
        }).then(function(response) {
            return response.data.session_token;
        });
    };


    $scope.initSwapsWidget = function () {
        return SwapsNetwork.init({
            updateSessionToken: function () {
                return updateSessionToken();
            },
        }).then(function (result) {
            $scope.swapIsInit = true;
            return result;
        });
    };

    $scope.setTab = function(tab) {
        $scope.showedTab = tab;
    };

});
