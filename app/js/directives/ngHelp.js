var module = angular.module('Directives');
module.directive('ngHelp', function($rootScope) {
    return {
        restrict: 'E',
        templateUrl: $rootScope.getTemplate('directives/ngHelp'),
        replace: true,
        scope: {
            ngHelp: '='
        },
        link: function($scope, element) {

        }
    }
});

