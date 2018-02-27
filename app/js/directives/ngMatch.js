angular.module('Directives').directive('ngMatch', ['$parse', function ($parse) {
    return {
        restrict: 'A',
        require: '?ngModel',
        link: function(scope, elem, attrs, ctrl) {
            if (!ctrl) return;
            if (!attrs['ngMatch']) return;
            var firstPassword = $parse(attrs['ngMatch']);

            var validator = function (value) {
                var temp = firstPassword(scope),
                    v = value === temp;
                ctrl.$setValidity('pattern', v);
                return value;
            };

            ctrl.$parsers.unshift(validator);
            ctrl.$formatters.push(validator);
            attrs.$observe('ngMatch', function () {
                validator(ctrl.$viewValue);
            });

        }
    }
}])