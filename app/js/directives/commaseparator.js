angular.module('Directives').directive('commaseparator', function($filter, $timeout) {
    var commaSeparateNumber = $filter('separateNumber');
    return {
        require: 'ngModel',
        scope: {
            commaseparator: '='
        },
        link: function(scope, elem, attrs, ctrl) {
            if (!ctrl) {
                return;
            }
            var oldValue;
            ctrl.$formatters.unshift(function(value) {
                oldValue = value;
                return commaSeparateNumber(ctrl.$modelValue);
            });
            ctrl.$parsers.unshift(function(viewValue) {
                var plainNumber = viewValue.replace(/[\,\-\+]/g, '');

                var valid = plainNumber ? new RegExp(scope.commaseparator.regexp).test(plainNumber) : true;

                if (plainNumber && !isNaN(plainNumber) && ((scope.commaseparator.min !== undefined) || (scope.commaseparator.max !== undefined))) {
                    var val = new BigNumber(plainNumber);

                    var rate = scope.commaseparator.rate || {};
                    rate.min = rate.min || 1;
                    rate.max = rate.max || 1;

                    var minValue = scope.commaseparator.min ? new BigNumber(scope.commaseparator.min).div(rate.min) : false;
                    var maxValue = scope.commaseparator.max ? new BigNumber(scope.commaseparator.max).div(rate.max) : false;

                    var minMaxValidation = (minValue ? val.minus(minValue) >= 0 : true) && (maxValue ? val.minus(maxValue) <= 0 : true);

                    ctrl.$setValidity('min-max', minMaxValidation);
                }

                if (!valid) {
                    ctrl.$setViewValue(oldValue);
                    elem.val(commaSeparateNumber(oldValue));
                    return plainNumber;
                } else {
                    ctrl.$setViewValue(plainNumber);
                    elem.val(commaSeparateNumber(plainNumber));
                    oldValue = plainNumber;
                    return plainNumber;
                }

            });

            if ((scope.commaseparator.min !== undefined) || (scope.commaseparator.max !== undefined)) {
                scope.$watchGroup(['commaseparator.max', 'commaseparator.min', 'commaseparator.rate'], function(newValue, oldValue) {
                    if (newValue === oldValue) return;
                    $timeout(function() {
                        ctrl.$$parseAndValidate();
                    });
                });
            }

            if (scope.commaseparator.notNull) {
                ctrl.$parsers.unshift(function(value) {
                    if (!value) return;
                    var plainNumber = value.replace(/[\,\.\-\+]/g, '') * 1;
                    ctrl.$setValidity('null-value', !!plainNumber);
                    return value;
                });
            }
            if (scope.commaseparator.checkWith) {
                ctrl.$parsers.push(function(value) {
                    if (!value) return;
                    var plainNumber = new BigNumber(value.replace(/[\,\.\-\+]/g, ''));
                    var checkModelValue = new BigNumber(scope.commaseparator.fullModel[scope.commaseparator.checkWith] || 0);
                    var rangeValues = plainNumber.minus(checkModelValue);
                    var valid = !scope.commaseparator.notEqual ? rangeValues <= 0 : rangeValues < 0;
                    ctrl.$setValidity('check-value', valid);
                    return value;
                });

                ctrl.$formatters.unshift(function(value) {
                    return commaSeparateNumber(ctrl.$modelValue);
                });

                scope.$watch('commaseparator.fullModel.' + scope.commaseparator.checkWith, function() {
                    ctrl.$$parseAndValidate();
                });
            }

            if (scope.commaseparator.autoCheck) {
                $timeout(function() {
                    ctrl.$$parseAndValidate();
                    ctrl.$setTouched();
                });
            }
        }
    };
});