var module = angular.module('Directives');
module.directive('ngHelp', function($rootScope, $cookies) {
    return {
        restrict: 'A',
        templateUrl: $rootScope.getTemplate('directives/ngHelp'),
        replace: true,
        scope: {
            ngHelp: '='
        },
        link: function($scope, element) {

            $scope.helpsList = $cookies.get('h_helps');
            var helpsList = $scope.helpsList ? JSON.parse($scope.helpsList) : [];

            $scope.hideHelp = function(el) {

                if ($scope.helpsList.indexOf($scope.ngHelp.id) == -1) {
                    $scope.ngHelp.hidden = true;
                    helpsList.push($scope.ngHelp.id);
                    element.slideUp('fast');
                    $cookies.put('h_helps', JSON.stringify(helpsList))
                }
            };
        }
    }
});

