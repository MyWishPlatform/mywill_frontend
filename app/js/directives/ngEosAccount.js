angular.module('Directives').directive('ngEosAccount', function() {
    return {
        'restrict': 'A',
        'templateUrl': '/templates/directives/ngEosAccount.html',
        'replace': true,
        'scope': {
            ngModel: '=',
            ngEosAccountOptions: '='
        },
        'controller': function ($scope) {},
        'link': function ($scope, element, attrs, ctrl) {}
    }
}).directive('ngEosAccountValidator', function(EOSService, $timeout) {
    var accountsInfoHash = {};
    return {
        require: 'ngModel',
        link: function ($scope, elem, attrs, ctrl) {
            $scope.field = ctrl;
            var checkAddressTimeout;
            var value;

            ctrl.$parsers.unshift(function(viewValue) {
                return viewValue.toLowerCase();
            });

            if ($scope.ngEosAccountOptions.onInit) {
                $scope.ngEosAccountOptions.onInit(ctrl, $scope.ngEosAccountOptions.name);
            }

            $scope.checkAddress = function(withoutTimeout) {
                $scope.ngEosAccountOptions.startChange ?
                    $scope.ngEosAccountOptions.startChange(ctrl) : false;
                var newValue = ctrl.$modelValue;

                // if (value === newValue) return;
                var currValue = value = newValue;
                checkAddressTimeout ? $timeout.cancel(checkAddressTimeout) : false;
                ctrl.$setValidity('check-sum', true);
                ctrl.$setValidity('not-checked', true);

                if (!ctrl.$valid) {
                    return;
                }
                ctrl.$$setModelValue(newValue);
                var accountKey = $scope.ngEosAccountOptions.network + '_' + currValue;

                withoutTimeout = withoutTimeout || !!accountsInfoHash[accountKey];

                if (!withoutTimeout) {
                    ctrl.$setValidity('not-checked', false);
                }

                checkAddressTimeout = $timeout(function() {
                    if (accountsInfoHash[accountKey]) {
                        ctrl.$setValidity('not-checked', true);
                        if (currValue !== ctrl.$modelValue) return;
                        $scope.ngEosAccountOptions.change ?
                            $scope.ngEosAccountOptions.change(ctrl, accountsInfoHash[accountKey]) : false;
                        return;
                    }
                    EOSService.checkAddress(currValue, $scope.ngEosAccountOptions.network).then(function(addressInfo) {
                        if (currValue !== ctrl.$modelValue) return;
                        ctrl.$setValidity('not-checked', true);
                        $scope.ngEosAccountOptions.change ?
                            $scope.ngEosAccountOptions.change(ctrl, addressInfo) : false;
                        ctrl.$setValidity('check-sum', !$scope.ngEosAccountOptions.invert);
                    }, function(response) {
                        console.log(arguments);
                        if (currValue !== ctrl.$modelValue) return;
                        ctrl.$setValidity('not-checked', true);
                        switch (response.status) {
                            case 500:
                                ctrl.$setValidity('check-sum', !!$scope.ngEosAccountOptions.invert);
                                break;
                            default:
                                ctrl.$setValidity('check-sum', true);
                                $scope.checkAddress();
                        }
                    });
                }, !withoutTimeout ? 500 : 0);
            };
            $timeout(function() {
                $scope.checkAddress(true);
            });
        }
    }
}).directive('ngEosToken', function() {
    return {
        'restrict': 'A',
        'templateUrl': '/templates/directives/ngEosToken.html',
        'replace': true,
        'scope': {
            ngModel: '=',
            ngEosTokenOptions: '='
        },
        'controller': function ($scope) {},
        'link': function ($scope, element, attrs, ctrl) {}
    }
}).directive('ngEosTokenValidator', function(EOSService, $timeout) {

    var tokensInfoHash = {};

    return {
        require: 'ngModel',
        link: function ($scope, elem, attrs, ctrl) {
            $scope.field = ctrl;
            var checkTokenTimeout;
            var value;

            ctrl.$parsers.unshift(function(viewValue) {
                return viewValue.toUpperCase();
            });

            if ($scope.ngEosTokenOptions.onInit) {
                $scope.ngEosTokenOptions.onInit(ctrl, $scope.ngEosTokenOptions.name);
            }

            var checkIssuer = function() {
                if (!tokenKey) return;
                var result = tokensInfoHash[tokenKey][value];
                if (!($scope.ngEosTokenOptions.tokenIssuer && result)) {
                    if (result) {
                        $scope.ngEosTokenOptions.change ?
                            $scope.ngEosTokenOptions.change(ctrl, result) : false;
                    }
                    return;
                }

                if (result['issuer'] !== $scope.ngEosTokenOptions.tokenIssuer) {
                    ctrl.$setValidity('this-admin', false);
                    return;
                }
                $scope.ngEosTokenOptions.change ?
                    $scope.ngEosTokenOptions.change(ctrl, result) : false;
            };

            var tokenKey;
            $scope.checkToken = function(withoutTimeout) {

                $scope.ngEosTokenOptions.startChange ?
                    $scope.ngEosTokenOptions.startChange(ctrl) : false;

                if ($scope.ngEosTokenOptions.noCheck) return;

                var newValue = ctrl.$modelValue;

                var currValue = value = newValue;
                checkTokenTimeout ? $timeout.cancel(checkTokenTimeout) : false;
                ctrl.$setValidity('check-sum', true);
                ctrl.$setValidity('not-checked', true);
                ctrl.$setValidity('this-admin', true);

                if (!ctrl.$valid) {
                    return;
                }
                ctrl.$setTouched();

                tokenKey = $scope.ngEosTokenOptions.network + '_' + currValue + '_' + $scope.ngEosTokenOptions.tokenAddress;
                withoutTimeout = withoutTimeout || !!tokensInfoHash[tokenKey];

                if (!withoutTimeout) {
                    ctrl.$setValidity('not-checked', false);
                }
                checkTokenTimeout = $timeout(function() {
                    if (tokensInfoHash[tokenKey]) {
                        ctrl.$setValidity('check-sum', !$scope.ngEosTokenOptions.invert);
                        if (currValue !== ctrl.$modelValue) return;
                        ctrl.$setValidity('not-checked', true);
                        checkIssuer();
                        return;
                    }
                    EOSService.coinInfo(
                        currValue, $scope.ngEosTokenOptions.network, $scope.ngEosTokenOptions.tokenAddress
                    ).then(function(result) {
                        ctrl.$setValidity('not-checked', true);
                        if (currValue !== ctrl.$modelValue) return;
                        if (!result[currValue]) {
                            ctrl.$setValidity('check-sum', !!$scope.ngEosTokenOptions.invert);
                        } else {
                            tokensInfoHash[tokenKey] = result;
                            $scope.ngEosTokenOptions.tokenAddress ? checkIssuer() : false;
                            ctrl.$setValidity('check-sum', !$scope.ngEosTokenOptions.invert);
                        }
                    }, function() {
                        ctrl.$setValidity('not-checked', true);
                        ctrl.$setValidity('check-sum', !!$scope.ngEosTokenOptions.invert);
                    });
                }, !withoutTimeout ? 500 : 0);
            };

            var addressRegExp = /[a-z1-5_.]{12}/;

            $scope.$watch('ngEosTokenOptions.tokenAddress', function() {
                if (!addressRegExp.test($scope.ngEosTokenOptions.tokenAddress)) return;
                value = false;
                $scope.checkToken(true);
            });

            $scope.$watch('ngEosTokenOptions.tokenIssuer', function() {
                ctrl.$setValidity('this-admin', true);
                if (!addressRegExp.test($scope.ngEosTokenOptions.tokenIssuer) || !value) return;
                checkIssuer();
            });

        }
    }
});
