angular.module('Directives').directive('ngAsyncAddressValidator', function ($http, $q, $filter, APP_CONSTANTS) {
    return {
        require: 'ngModel',
        scope: {
            ngAsyncAddressValidator: '='
        },
        link: function (scope, elem, attrs, ctrl) {

            var checkAddressLink;
            // console.log(1, scope.ngAsyncAddressValidator.network);
            switch (scope.ngAsyncAddressValidator.network) {
                case 'ETH':
                    elem.attr('placeholder', elem.attr('placeholder') || APP_CONSTANTS.TEST_ADDRESSES.ETH);
                    break;
                case 'NEO':
                    checkAddressLink = 'check_neo3_address';
                    elem.attr('placeholder', elem.attr('placeholder') || APP_CONSTANTS.TEST_ADDRESSES.NEO);
                    break;
                case 'TRON':
                    elem.attr('placeholder', elem.attr('placeholder') || APP_CONSTANTS.TEST_ADDRESSES.TRON);
                    break;
                case 'BNB':
                    elem.attr('placeholder', elem.attr('placeholder') || APP_CONSTANTS.TEST_ADDRESSES.BNB);
                case 'XINFIN':
                    elem.attr('placeholder', elem.attr('placeholder') || APP_CONSTANTS.TEST_ADDRESSES.XINFIN);
                case 'SOLANA':
                    checkAddressLink = 'check_solana_address';
                    elem.attr('placeholder', elem.attr('placeholder') || APP_CONSTANTS.TEST_ADDRESSES.SOLANA);
            }

            ctrl.$asyncValidators.validAddress = function (modelValue, viewValue) {
            // console.log(2, modelValue);
            // console.log(3, viewValue);

                if(!modelValue) {
                    return false;
                }

                console.log(checkAddressLink);
                return $http.post('https://contracts.mywish.io/api/v1/'+ checkAddressLink + '/', {
                    "address": modelValue
                }, {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }).then(function (res) {
                    if(res) {
                        if(res.data.validation) {
                            return true;
                        } else {
                            return $q.reject();
                        }
                    } else {
                        return $q.reject();
                    }
                })
            }

        }
    }
});
