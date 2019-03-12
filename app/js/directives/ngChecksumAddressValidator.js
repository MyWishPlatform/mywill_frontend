angular.module('Directives').directive('ngChecksumAddressValidator', function($filter, APP_CONSTANTS) {
    return {
        require: 'ngModel',
        scope: {
            ngChecksumAddressValidator: '='
        },
        link: function(scope, elem, attrs, ctrl) {

            switch(scope.ngChecksumAddressValidator.network) {
                case 'ETH':
                    elem.attr('placeholder', elem.attr('placeholder') || APP_CONSTANTS.TEST_ADDRESSES.ETH);
                    break;
                case 'NEO':
                    elem.attr('placeholder', elem.attr('placeholder') || APP_CONSTANTS.TEST_ADDRESSES.NEO);
                    break;
                case 'TRON':
                    elem.attr('placeholder', elem.attr('placeholder') || APP_CONSTANTS.TEST_ADDRESSES.TRON);
                    break;
            }

            var validator = function(value) {
                if (!value) return;
                var val = value;
                if (scope.ngChecksumAddressValidator.network === 'ETH') {
                    val = $filter('toCheckSum')(val);
                }

                var validAddress;

                switch(scope.ngChecksumAddressValidator.network) {
                    case 'TRON':
                        validAddress = TronWeb.isAddress(val);
                        break;
                    default:
                        validAddress = WAValidator.validate(val, scope.ngChecksumAddressValidator.network);
                        break;
                }
                ctrl.$setValidity('valid-address', validAddress);
                return validAddress ? value : null;
            };

            ctrl.$parsers.unshift(validator);
            ctrl.$formatters.unshift(validator);

        }
    }
});
