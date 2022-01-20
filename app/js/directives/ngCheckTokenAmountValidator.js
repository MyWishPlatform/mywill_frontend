angular.module('Directives').directive('ngCheckTokenAmountValidator', function () {
    return {
        require: 'ngModel',
        link: function (scope, elem, attrs, ctrl) {
            const checkAmount = function (modelValue){
                if (!modelValue || modelValue > Math.pow(2, 64)) {
                    ctrl.$setValidity('amount', false);
                }
                else{
                    ctrl.$setValidity('amount', true);
                }
                return modelValue;
            }
            ctrl.$parsers.push(checkAmount);
            ctrl.$formatters.unshift(checkAmount);
        }
    }
});