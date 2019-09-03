angular.module('app').controller('trySwapController', function($scope) {

    $scope.showedTab = 'list';

    $scope.iniSwapsList = function() {
        // SwapsNetwork.getSwapOrdersList().then(function(result) {
        // });
        SwapsNetwork.drawOrdersList('orders-list').then((orders) => {
            console.log(orders);
        });
    };

    $scope.iniSwapsForm = function() {
        SwapsNetwork.drawForm('swaps-network-widget', {
            onSubmit: function(result) {
                $scope.setTab('list');
                $scope.$apply();
            }
        });
    };

    $scope.swapIsInit = false;

    $scope.initSwapsWidget = function() {
        SwapsNetwork.init({
            userId: $scope.currentUser ? $scope.currentUser.id : 'DEFAULT',
            onError: function(error) {
                console.log(error);
            }
        }).then((result) => {
            $scope.swapIsInit = true;
            $scope.$apply();
        });
    };

    $scope.setTab = function(tab) {
        $scope.showedTab = tab;
    };

});
