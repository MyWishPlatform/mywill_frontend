angular.module('Directives').directive('ngCheckTokenAmountValidator', function ($rootScope) {
    return {
        require: 'ngModel',
        link: function (scope, elem, attrs, ctrl) {
            $rootScope.$watch('decimalsSolana', function(decimals) {
                var decimalsSolana = +decimals

                const checkAmount = function (modelValue){
                    if (!modelValue || modelValue > (Math.pow(2, 64) / Math.pow(10, decimalsSolana))) {
                        ctrl.$setValidity('amount', false);
                    }
                    else{
                        if (modelValue.indexOf('.') >= 0 && modelValue.toString(10).split('.')[1]) {
                            if (modelValue.toString(10).split('.')[1].length > decimalsSolana) {
                                ctrl.$setValidity('amount', false);
                                return;
                            }
                        }
                        ctrl.$setValidity('amount', true);
                    }
                    return modelValue;
                }
                ctrl.$parsers.push(checkAmount);
                ctrl.$formatters.unshift(checkAmount);
            });
        }
    }
});
