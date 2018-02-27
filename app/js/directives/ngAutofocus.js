angular.module('Directives').directive('ngAutofocus', ['$timeout', function ($timeout) {
    return {
        restrict: 'A',
        link: function(scope, elem, attrs, ctrl) {
            $timeout(function() {
                elem.focus();
            });
        }
    }
}]);