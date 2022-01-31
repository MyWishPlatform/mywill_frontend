angular.module('Directives').directive('ngCheckTokenAmountValidator', function ($filter, $timeout) {
    var commaSeparateNumber = $filter('separateNumber');
    return {
        require: 'ngModel',
        scope: {
            ngCheckTokenAmountValidator: '='
        },
        link: function (scope, elem, attrs, ctrl) {

            if (!ctrl) {
                return;
            }
            var oldValue;
            ctrl.$formatters.unshift(function(value) {
                oldValue = value;
                return commaSeparateNumber(ctrl.$modelValue);
            });
            ctrl.$parsers.unshift(function(viewValue) {
                if (!viewValue.length) {
                    ctrl.$setValidity('min-max', true);
                    return '';
                }
                var plainNumber = viewValue.replace(/[\,\-\+]/g, '').replace(/[^0-9\.]/g, '').replace(/^0+/g, '0').replace(/^0+([1-9]+)/g, function(match, p1) { return p1 });

                var valid = plainNumber ? new RegExp(scope.ngCheckTokenAmountValidator.regexp).test(plainNumber) : true;
                if (plainNumber && !isNaN(plainNumber) && ((scope.ngCheckTokenAmountValidator.min !== undefined) || (scope.ngCheckTokenAmountValidator.max !== undefined))) {
                    var val = new BigNumber(plainNumber);

                    var rate = scope.ngCheckTokenAmountValidator.rate || {};
                    rate.min = rate.min || 1;
                    rate.max = rate.max || 1;


                    var minValue = scope.ngCheckTokenAmountValidator.min ? new BigNumber(scope.ngCheckTokenAmountValidator.min.toString()).div(rate.min) : false;
                    var maxValue = scope.ngCheckTokenAmountValidator.max ? new BigNumber(scope.ngCheckTokenAmountValidator.max.toString()).div(rate.max) : false;

                    var minMaxValidation = (minValue ? val.minus(minValue) >= 0 : true) && (maxValue ? val.minus(maxValue) <= 0 : true);

                    checkAmount(viewValue);
                    ctrl.$setValidity('min-max', minMaxValidation);
                }

                if (!valid) {
                    ctrl.$setViewValue(oldValue);
                    elem.val(commaSeparateNumber(oldValue));
                    checkAmount(plainNumber);
                    return oldValue;
                } else {
                    ctrl.$setViewValue(plainNumber);
                    elem.val(commaSeparateNumber(plainNumber));
                    oldValue = plainNumber;
                    checkAmount(plainNumber);
                    return plainNumber;
                }

            });

            if ((scope.ngCheckTokenAmountValidator.min !== undefined) || (scope.ngCheckTokenAmountValidator.max !== undefined)) {
                scope.$watchGroup(['commaseparator.max', 'commaseparator.min', 'commaseparator.rate'], function(newValue, oldValue) {
                    if (newValue === oldValue) return;
                    $timeout(function() {
                        ctrl.$$parseAndValidate();
                    });
                });
            }

            if (scope.ngCheckTokenAmountValidator.notNull) {
                ctrl.$parsers.unshift(function(value) {
                    if (!value) return;
                    var plainNumber = value.replace(/[\,\.\-\+]/g, '') * 1;
                    ctrl.$setValidity('null-value', !!plainNumber);
                    return value;
                });
            }
            if (scope.ngCheckTokenAmountValidator.checkWith) {
                ctrl.$parsers.push(function(value) {
                    if (!value) return;
                    var plainNumber = new BigNumber(value.replace(/[\,\.\-\+]/g, ''));
                    var checkModelValue = new BigNumber(scope.ngCheckTokenAmountValidator.fullModel[scope.ngCheckTokenAmountValidator.checkWith] || 0);
                    var rangeValues = plainNumber.minus(checkModelValue);
                    var valid = !scope.ngCheckTokenAmountValidator.notEqual ? rangeValues <= 0 : rangeValues < 0;
                    ctrl.$setValidity('check-value', valid);
                    return value;
                });

                ctrl.$formatters.unshift(function(value) {
                    return commaSeparateNumber(ctrl.$modelValue);
                });

                scope.$watch('commaseparator.fullModel.' + scope.ngCheckTokenAmountValidator.checkWith, function() {
                    ctrl.$$parseAndValidate();
                });
            }

            if (scope.ngCheckTokenAmountValidator.autoCheck) {
                $timeout(function() {
                    ctrl.$$parseAndValidate();
                    ctrl.$setTouched();
                });
            }


            const checkAmount = function (modelValue){
                var decimals = scope.ngCheckTokenAmountValidator.decimals;
                var value = new BigNumber(modelValue).toString();
                var valueTomCompare = new BigNumber('18446744073709551615').dividedBy(new BigNumber(new BigNumber(10).pow(scope.ngCheckTokenAmountValidator.decimals))).toString();
                if (!modelValue || new BigNumber(value).comparedTo(valueTomCompare) > 0) {
                    ctrl.$setValidity('amount', false);
                    return;
                }
                else{
                    if (value.indexOf('.') >= 0 && value.toString(10).split('.')[1]) {
                        if (value.split('.')[1].length > decimals) {
                            ctrl.$setValidity('amount', false);
                            return;
                        }
                    }
                    ctrl.$setValidity('amount', true);
                }
                return value;
            }
        }
    }
});
