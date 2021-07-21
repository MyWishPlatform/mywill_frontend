angular.module('Directives').directive('ngAsyncAddressValidator', function ($http, $q, $filter, APP_CONSTANTS) {
    return {
        require: 'ngModel',
        scope: {
            ngAsyncAddressValidator: '='
        },
        link: function (scope, elem, attrs, ctrl) {

            switch (scope.ngAsyncAddressValidator.network) {
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

            ctrl.$asyncValidators.validAddress = function (modelValue, viewValue) {

                if(!modelValue) {
                    return false;
                }

                return $http.post('https://dev2.mywish.io/api/v1/check_neo3_address/', {
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
