angular.module('Directives').directive('ngChecksumAddressValidator', function ($http, $filter, APP_CONSTANTS) {
    return {
        require: 'ngModel',
        scope: {
            ngChecksumAddressValidator: '='
        },
        link: function (scope, elem, attrs, ctrl) {

            switch (scope.ngChecksumAddressValidator.network) {
                case 'ETH':
                    elem.attr('placeholder', elem.attr('placeholder') || APP_CONSTANTS.TEST_ADDRESSES.ETH);
                    break;
                case 'NEO':
                    elem.attr('placeholder', elem.attr('placeholder') || APP_CONSTANTS.TEST_ADDRESSES.NEO);
                    break;
                case 'TRON':
                    elem.attr('placeholder', elem.attr('placeholder') || APP_CONSTANTS.TEST_ADDRESSES.TRON);
                    break;
                case 'BNB':
                    elem.attr('placeholder', elem.attr('placeholder') || APP_CONSTANTS.TEST_ADDRESSES.BNB);
                case 'XINFIN':
                    elem.attr('placeholder', elem.attr('placeholder') || APP_CONSTANTS.TEST_ADDRESSES.XINFIN);
            }

            var validator = function (value) {

                if (!value) return;

                var val = value;

                var validAddress;

                switch (scope.ngChecksumAddressValidator.network) {
                    case 'TRON':
                        validAddress = TronWeb.isAddress(val);
                        break;
                    case 'BNB':
                        validAddress = new RegExp(/(t)?bnb1[0-9a-z]{38}/).test(val);
                        break;
                    case 'XINFIN':
                        validAddress = (val.slice(0, 3) === 'xdc' && Web3.utils.isAddress('0x' + val.slice(3)));
                        break;
                    default:
                        validAddress = WAValidator.validate(val, scope.ngChecksumAddressValidator.network);
                        break;
                }

                ctrl.$setValidity('valid-address', validAddress);
                return validAddress ? value : false;
        };

        ctrl.$parsers.unshift(validator);
        ctrl.$formatters.unshift(validator);


    }
}
});
