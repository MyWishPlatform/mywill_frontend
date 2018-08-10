angular.module('Directives').directive('ngChecksumAddressValidator', function($filter) {
    return {
        require: 'ngModel',
        scope: {
            ngChecksumAddressValidator: '='
        },
        link: function(scope, elem, attrs, ctrl) {
            ctrl.$formatters.unshift(function (value) {
                return ctrl.$modelValue;
            });

            switch(scope.ngChecksumAddressValidator.network) {
                case 'ETH':
                    elem.attr('placeholder', elem.attr('placeholder') || '0x1234567890adfbced543567acbedf34565437e8f');
                    break;
                case 'NEO':
                    elem.attr('placeholder', elem.attr('placeholder') || 'AP5n92qDhmoNGP5S71LMBBmn9C4XcMGZDz');
                    break;
            }

            ctrl.$parsers.unshift(function(value) {
                if (!value) return;
                var val = value;
                if (scope.ngChecksumAddressValidator.network === 'ETH') {
                    val = $filter('toCheckSum')(val);
                }
                var validAddress = WAValidator.validate(val, scope.ngChecksumAddressValidator.network);
                ctrl.$setValidity('valid-address', validAddress);
                return validAddress ? value : false;
            });
        }
    }
});
