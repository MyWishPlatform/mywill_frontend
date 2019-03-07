angular.module('Directives').directive('ngCustomEmail', function($filter) {
    return {
        require: 'ngModel',
        link: function(scope, elem, attrs, ctrl) {

            var validator = function(value) {
                ctrl.$setValidity('valid-email', $filter('isEmail')(value));
                return value;
            };

            ctrl.$parsers.unshift(validator);
            ctrl.$formatters.unshift(validator);

        }
    }
});
