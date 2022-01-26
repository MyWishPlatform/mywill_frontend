angular.module('Directives').directive('ngCheckTokenAmountValidator', function ($rootScope) {
    return {
        require: 'ngModel',
        link: function (scope, elem, attrs, ctrl) {
            $rootScope.$watch('decimals', function(decimals) {
                var decimals = +decimals;
                var maxPossibleIntForSolana = Math.pow(2, 64);
                if (decimals === 1) {
                    var resultMaxIntForSolana = +maxPossibleIntForSolana;
                } else {
                    resultMaxIntForSolana = Math.pow(10,20) / Math.pow(10, decimals) - 1;
                }
                // console.log('maxPossibleIntForSolana', maxPossibleIntForSolana);
                // console.log('resultMaxIntForSolana', resultMaxIntForSolana);

                const checkAmount = function (modelValue){
                    // console.log('modelValue: ', +modelValue, 'result: ', +resultMaxIntForSolana);
                    // console.log('modelValue', +modelValue > +resultMaxIntForSolana);
                    if (!modelValue || +modelValue > +resultMaxIntForSolana) {
                        ctrl.$setValidity('amount', false);
                    }
                    else{
                        ctrl.$setValidity('amount', true);
                    }
                    return modelValue;
                }
                ctrl.$parsers.push(checkAmount);
                ctrl.$formatters.unshift(checkAmount);
            }, true);
        }
    }
});
