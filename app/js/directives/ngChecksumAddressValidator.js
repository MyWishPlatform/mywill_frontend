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
                    break;
                case 'XINFIN':
                    elem.attr('placeholder', elem.attr('placeholder') || APP_CONSTANTS.TEST_ADDRESSES.XINFIN);
                    break;
                case 'SOLANA':
                    elem.attr('placeholder', elem.attr('placeholder') || APP_CONSTANTS.TEST_ADDRESSES.SOLANA);
                    break;
                case 'NEAR':
                    elem.attr('placeholder', elem.attr('placeholder') || APP_CONSTANTS.TEST_ADDRESSES.NEAR);
                    break;
            }

            var validator = function (value) {
                console.log(777, value);

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
                    case 'SOLANA':
                        validAddress = true;
                        break;
                    case 'NEAR':
                        validAddress = new RegExp(/^(([a-z\d]+[\-_])*[a-z\d]+\.)*([a-z\d]+[\-_])*[a-z\d]+$/).test(val);
                        if (!validAddress) {
                            validAddress = new RegExp(/^[a-fA-F\d]{64}$/).test(val);
                        }

                        var encodedData = JSON.stringify ( {
                            "jsonrpc": "2.0",
                            "method": "query",
                            "params": {    request_type: "view_account", finality: "final", account_id: value },
                            "id": "doncare"
                        } );
                        $http.post('https://rpc.testnet.near.org/', encodedData, {
                            headers: {
                                'Content-Type': 'application/json',
                            }
                        })
                            .catch(function (e) {
                                console.error('Error from https://rpc.testnet.near.org/', e);
                                return null;
                            })
                            .then(function (res) {
                                console.log(111, 'https://rpc.testnet.near.org/', res);
                                console.log(222, res.data.error);
                                console.log(333, res.data.result);
                                if (res.data.error) {
                                    console.log(444);
                                    validAddress = false;
                                }
                            })
                        console.log('validAddress', validAddress);
                        break;
                    default:
                        validAddress = WAValidator.validate(val, scope.ngChecksumAddressValidator.network) && val !== '0x0000000000000000000000000000000000000000';
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
