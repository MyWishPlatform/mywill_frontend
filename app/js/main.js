'use strict';
angular.module('Directives', []);
angular.module('Services', []);
angular.module('Filters', []);
angular.module('Constants', []);

var module = angular.module('app', [
    'Constants', 'ui.router', 'Directives', 'Services', 'Filters', 'ngCookies', 'templates',
    'datePicker', 'angular-clipboard', 'ngFileSaver', 'pascalprecht.translate']);
if (UAParser(window.navigator.userAgent).device.type === "mobile") {
    module.requires.push('ngTouch');
}

module.controller('mainMenuController', function($scope, MENU_CONSTANTS) {
    $scope.menuList = MENU_CONSTANTS;
}).controller('baseController', function($scope, $rootScope, $translate, $timeout, $cookies, authService) {
    $rootScope.showedMenu = false;
    $rootScope.menuTogglerOff = false;
    $rootScope.toggleMenu = function(state, event) {
        if (angular.element('body').is('.popup-showed')) return;
        if (state === undefined) {
            state = !$rootScope.showedMenu;
        }
        $rootScope.showedMenu = state;
    };

    $rootScope.languagesList = {
        'ja': {
            'name': '日本語',
            'icon': 'ja'
        },
        'en': {
            'name': 'English',
            'icon': 'us'
        }
    };

    $rootScope.setLanguage = function(lng, noSave) {
        if ($rootScope.language === lng) return;
        $rootScope.language = lng;
        $cookies.put('lang', lng, {path: '/'});
        $translate.use($rootScope.language).then(function() {
            $scope.loadedContent = true;
        });
        !noSave ? authService.setLanguage(lng) : false;
    };

    $rootScope.visibleGirl = false;
    var clickBodyCounter = 0, clickTimer;
    var bodyClickHandler = function() {
        clickTimer ? $timeout.cancel(clickTimer) : false;
        clickBodyCounter++;
        if (clickBodyCounter === 10) {
            $rootScope.visibleGirl = true;
            $rootScope.$apply();
            angular.element('body').off('click', bodyClickHandler);
            return;
        }
        clickTimer = $timeout(function() {
            clickBodyCounter = 0;
        }, 500);
    };
    angular.element('body').on('click', bodyClickHandler);

}).controller('headerController', function($rootScope, $scope) { })
    .controller('authorizationController', function(authService, $rootScope, $scope, SocialAuthService) {
    /* Social networks buttons */
    $scope.socialAuthError = false;
    var onAuth = function(response) {
        $rootScope.$broadcast('$userOnLogin', $scope.ngPopUp.params.onLogin || false);
        $scope.closeCurrentPopup();
    };
    $scope.serverErrors = {};
    $scope.socialAuthInfo = {};
    var errorSocialAuth = function(response, request, type) {
        $scope.socialAuthInfo = {
            network: type,
            request: request
        };
        switch (response.status) {
            case 403:
                $scope.socialAuthError = response.data.detail;
                switch ($scope.socialAuthError) {
                    case '1030':

                        break;
                    case '1031':

                        break;
                    case '1032':

                        break;
                    case '1033':
                        $scope.serverErrors = {totp: 'Invalid code'};
                        break;
                }
                break;
        }
    };

    $scope.fbLogin = function(advancedData) {
        SocialAuthService.facebookAuth(onAuth, errorSocialAuth, advancedData);
    };
    $scope.googleLogin = function(advancedData) {
        SocialAuthService.googleAuth(onAuth, errorSocialAuth, advancedData);
    };
    $scope.continueSocialAuth = function(form) {
        if (!form.$valid) return;
        switch ($scope.socialAuthInfo.network) {
            case 'google':
                $scope.googleLogin($scope.socialAuthInfo.request);
                break;
            case 'facebook':
                $scope.fbLogin($scope.socialAuthInfo.request);
                break;
        }
    };

    /* Reset password */
    $scope.forgotRequest = {};
    $scope.forgotServerErrors = undefined;

    $scope.sendResetPassForm = function(resetForm) {
        if (!resetForm.$valid) return;
        $scope.forgotServerErrors = undefined;
        $scope.forgotSuccessText = false;
        authService.passwordReset($scope.forgotRequest.email).then(function (response) {
            $scope.forgotSuccessText = response.data.detail;
        }, function (response) {
            switch (response.status) {
                case 400:
                    $scope.forgotServerErrors = response.data;
                    break;
            }
        });
    };

    /* Log in */
    $scope.twoFAEnabled = false;
    $scope.logInRequest = {};
    $scope.logInServerErrors = undefined;

    $scope.sendLoginForm = function(authForm) {
        if (!authForm.$valid) return;
        $scope.logInServerErrors = undefined;
        authService.auth({
            data: $scope.logInRequest
        }).then(function (response) {
            onAuth();
        }, function (response) {
            switch (response.status) {
                case 400:
                    $scope.logInServerErrors = response.data;
                    break;
                case 403:
                    switch (response.data.detail) {
                        case '1019':
                            $scope.twoFAEnabled = true;
                            break;
                        case '1020':
                            $scope.logInServerErrors = {totp: 'Invalid code'};
                            break;
                    }
                    break;
            }
        });
    };

    /* Registration */
    $scope.regRequest = {};
    $scope.regServerErrors = undefined;

    $scope.sendRegForm = function(regForm) {
        if (!regForm.$valid) return;
        $scope.regRequest.email = $scope.regRequest.username;
        $scope.regServerErrors = undefined;
        authService.registration({
            data: $scope.regRequest
        }).then(function(response) {
            $scope.ngPopUp.params.page = 'email-confirm';
        }, function(response) {
            switch (response.status) {
                case 400:
                    $scope.regServerErrors = response.data;
                    break;
            }
        });
    };

})
    .run(function(APP_CONSTANTS, $rootScope, $window, $timeout, $state, $q, $location, authService,
                MENU_CONSTANTS, $interval, AnalyticsService, $cookies) {

    $rootScope.getNetworkPath = function(network) {
        return ((network == 1) || (network == 2)) ? 'eth' : ((network == 3) || (network == 4) ? 'rsk' : 'neo');
    };

    $rootScope.getEtherscanUrl = function(contract, path) {
        var networkType = (contract.network || 1) * 1;
        var addressPaths = {}, networkUrl;

        switch(networkType) {
            case 1:
                networkUrl = APP_CONSTANTS.ETHERSCAN_ADDRESS;
                addressPaths.address = 'address';
                addressPaths.token = 'token';
                break;
            case 2:
                networkUrl = APP_CONSTANTS.ROPSTEN_ETHERSCAN_ADDRESS;
                addressPaths.address = 'address';
                addressPaths.token = 'token';
                break;
            case 3:
                networkUrl = APP_CONSTANTS.RSK_ADDRESS;
                addressPaths.address = 'addr';
                break;
            case 4:
                networkUrl = APP_CONSTANTS.RSK_TESTNET_ADDRESS;
                addressPaths.address = 'addr';
                break;

            case 5:
                networkUrl = APP_CONSTANTS.NEO_MAINNET_ADDRESS;
                addressPaths.address = 'address/info';
                addressPaths.token = 'address/info';
                break;
            case 6:
                networkUrl = APP_CONSTANTS.NEO_TESTNET_ADDRESS;
                addressPaths.address = 'address/info';
                addressPaths.token = 'address/info';
                break;

        }
        return networkUrl + (addressPaths[path] || '');
    };


    $rootScope.max = Math.max;
    $rootScope.min = Math.min;

    var loginWatcherInProgress;

    $rootScope.checkProfile = function(event, requestData) {
        if (loginWatcherInProgress) return;
        loginWatcherInProgress = true;
        authService.profile().then(function(data) {
            $rootScope.setCurrentUser(data.data);
            if (!$rootScope.currentUser.is_ghost) {
                (requestData && requestData.callback) ? requestData.callback(true) : false;
            }
            $rootScope.$broadcast('$userUpdated');
            loginWatcherInProgress = false;
        }, function() {
            loginWatcherInProgress = false;
        });
    };
    $rootScope.$on('$userOnLogin', $rootScope.checkProfile);


    $rootScope.sendEvent = AnalyticsService.sendEvent;
    AnalyticsService.initGA();

    $rootScope.$location = $location;

    $rootScope.contractTypesIcons = {
        0: 'icon-lastwill',
        1: 'icon-key',
        2: 'icon-deferred',
        3: '',
        4: 'icon-crowdsale',
        5: 'icon-token',
        6: 'icon-token'
    };

    $rootScope.deviceInfo = UAParser(window.navigator.userAgent);

    $rootScope.globalProgress = false;
    $rootScope.finishGlobalProgress = false;

    $rootScope.gitHubLink = 'https://github.com/MyWishPlatform/contracts/tree/develop';
    $rootScope.$state = $state;
    $rootScope.numberReplacer = /,/g;
    $rootScope.weiDelta = Math.pow(10, 18);

    var defaultLng = (navigator.language||navigator.browserLanguage).split('-')[0];
    $rootScope.setCurrentUser = function(profile) {

        if (profile.lang) {
            $rootScope.setLanguage(profile.lang, true);
        } else {
            var lng = $cookies.get('lang') || ($rootScope.languagesList[defaultLng] ? defaultLng : 'en');
            $rootScope.setLanguage(lng);
        }


        if (!profile) {
            $state.go('exit');
            return;
        }
        var userBalance = new BigNumber(profile.balance);
        profile.visibleBalance = userBalance.div(Math.pow(10, 18)).toFormat(2);
        profile.balanceInRefresh = $rootScope.currentUser ? $rootScope.currentUser.balanceInRefresh : false;
        $rootScope.currentUser = profile;
        return profile;
    };

    $rootScope.getTemplate = function(template) {
        return APP_CONSTANTS.TEMPLATES.PATH + '/' + template + '.html';
    };
    $rootScope.showMenu = function() {
        $rootScope.openedMenu = true;
    };
    $rootScope.hideMenu = function() {
        $rootScope.openedMenu = false;
    };

    $rootScope.toBack = function() {
        if ($rootScope.currentState.startedPage) {
            return false;
        }
        history.go(-1);
        return true;
    };

    // var currentUserDefer = $q.defer();
    var createDefer = function() {
        $rootScope.currentUserDefer = $q.defer();
    };

    var dateRange = 0;

    $rootScope.getNowDateTime = function(addedTime) {
        return new Date((new Date()).getTime() + dateRange);
    };

    var getCurrentUser = function(isGhost) {
        authService.profile().then(function(data) {
            if (data) {
                dateRange = (new Date(data.headers('date'))).getTime() - (new Date()).getTime();
                $rootScope.setCurrentUser(data.data);
                iniApplication();
                $rootScope.currentUserDefer.resolve(data);
            } else {
                if (!isGhost) {
                    return $state.go('exit');
                }
            }
        }, function(response) {
            var errorCode = response.status;
            switch(errorCode) {
                case 403:
                    $rootScope.setCurrentUser(APP_CONSTANTS.EMPTY_PROFILE);
                    iniApplication();
                    $rootScope.currentUserDefer.resolve({
                        data: APP_CONSTANTS.EMPTY_PROFILE
                    });
                    break;
            }
            // $rootScope.currentUserDefer.resolve(false);
            // if (!isGhost) {
            //     return $state.go('exit');
            // }
        });
        return $rootScope.currentUserDefer.promise;
    };
    $rootScope.getCurrentUser = getCurrentUser;

    var balanceLoaded = false;
    $rootScope.getCurrentBalance = function() {

        if ($rootScope.currentUser.balanceInRefresh) return;
        balanceLoaded = false;

        $rootScope.currentUser.balanceInRefresh = $interval(function() {
            if (balanceLoaded) {
                $interval.cancel($rootScope.currentUser.balanceInRefresh);
                $rootScope.currentUser.balanceInRefresh = false;
            }
        }, 1000);

        getCurrentUser().then(function() {
            balanceLoaded = true;
        }, function() {
            balanceLoaded = true;
        });
    };

    $rootScope.$on("$locationChangeSuccess", function(event, newLocation, oldLocation) {
        $rootScope.currentState = $location.state() || {};

        if (newLocation === oldLocation) return;

        if (!$rootScope.currentState.inHistory) {
            $rootScope.currentState.inHistory = true
        }
        history.replaceState($rootScope.currentState, null);
    });

    var progressTimer;
    $rootScope.$on("$stateChangeSuccess", function(event, newLocation, newStateParams, oldLocation, oldStateParams) {
        $rootScope.closeCommonPopup();
        $rootScope.showedMenu = false;

        angular.element($window).scrollTop(0);
        if (progressTimer) {
            $timeout.cancel(progressTimer);
        }
        var itemFromMenuConst = MENU_CONSTANTS.filter(function(menuItem) {
            return menuItem.route === $state.current.name;
        })[0];
        $rootScope.headerTitle = $state.current.title || (itemFromMenuConst ? itemFromMenuConst['title'] : '');
        if (!newLocation.resolve) return;
        progressTimer = $timeout(function() {
            $rootScope.globalProgress = false;
            $rootScope.finishGlobalProgress = true;
            progressTimer = $timeout(function() {
                $rootScope.finishGlobalProgress = false;
            }, 400);
        }, 350);
    });
    $rootScope.closeCommonPopup = function() {
        $rootScope.commonOpenedPopup = false;
        $rootScope.commonOpenedPopupParams = false;
    };
    var checkLocation = function(newLocation, oldLocation, event) {
        if (newLocation.data && newLocation.data.notAccess && $rootScope.currentUser[newLocation.data.notAccess]) {
            event.preventDefault();
            $rootScope.commonOpenedPopupParams = {
                newPopupContent: true
            };
            $rootScope.commonOpenedPopup = 'alerts/ghost-user-buy-tokens';
            if (oldLocation.name) {
                $state.go(oldLocation.name);
            } else {
                $state.go('main.createcontract.types');
            }
            return false;
        }
        return true;
    };
    createDefer();

    var showProgress = function(newLocation) {
        if (newLocation.resolve) {
            $rootScope.globalProgress = true;
            $rootScope.finishGlobalProgress = false;
        }
    };
    $rootScope.$on("$stateChangeStart", function(event, newLocation, newStateParams, oldLocation, oldStateParams) {
        getCurrentUser(newLocation.name === 'anonymous');

        if (newLocation.name === 'anonymous') {
            return;
        }

        if (!$rootScope.currentUser) {
            $rootScope.currentUserDefer.promise.then(function() {
                checkLocation(newLocation, oldLocation) ? showProgress(newLocation) : false;
            }, function() {
                console.error('Unknown profile');
            });
        } else {
            checkLocation(newLocation, oldLocation, event) ? showProgress(newLocation) : false;
        }
    });
    var stateHandlersActivate = function() {
        var locationState = $location.state() || {};

        if (!locationState.inHistory) {
            locationState.startedPage = true;
            locationState.inHistory = true
        }
        history.replaceState(locationState, null);
    };
    var initedApp = false;
    var iniApplication = function() {
        if (!initedApp) {
            initedApp = true;
            stateHandlersActivate();
        }
    };

    var offset = moment().utcOffset() / 60;
    $rootScope.currentTimezone = (offset > 0 ? '+' : '') + offset;

    $rootScope.bigNumber = function(value) {
        return ((value != 0) && !isNaN(value)) ? new BigNumber(value) : new BigNumber('0');
    };

    $rootScope.web3Utils = Web3.utils;

    $rootScope.isProduction = $location.host().indexOf('contracts.mywish.io')>=0;
    $rootScope.isDevelop = $location.host().indexOf('localhost')>=0;

    $rootScope.openAuthWindow = function(page) {
        $rootScope.commonOpenedPopup = 'login';
        $rootScope.commonOpenedPopupParams = {
            newPopupContent: true,
            'class': 'login-form',
            'page': page
        };
    };

    $rootScope.hideGlobalError = function() {
        if ($rootScope.globalError.onclick) {
            $rootScope.globalError.onclick();
        }
        $rootScope.globalError = false;
    };

})
    .config(function($httpProvider, $qProvider, $compileProvider, $translateProvider) {
        $httpProvider.defaults.xsrfCookieName = 'csrftoken';
        $httpProvider.defaults.xsrfHeaderName = 'X-CSRFToken';
        $qProvider.errorOnUnhandledRejections(false);
        $compileProvider.aHrefSanitizationWhitelist(/^\s*(mailto|otpauth|https?):/);
        $translateProvider.useStaticFilesLoader({
            prefix: '/static/i18n/',
            suffix: '.json'
        });

    })
    .filter('isEmail', function($filter) {
    return function(email) {
        var input = angular.element('<input>').attr({type: 'email'});
        input.val(email);
        return input.get(0).validity.valid;
    }
})
    .filter('declNumber', function($filter) {
    return function(value, words) {
        var float = value % 1;
        value = Math.floor(Math.abs(value));
        var cases = [2, 0, 1, 1, 1, 2];
        return words[float ? 1 : (value % 100 > 4 && value % 100 < 20) ? 2 : cases[(value % 10 < 5) ? value % 10 : 5]];
    }
})
    .filter('separateNumber', function() {
    return function(val) {
        val = (val || '') + '';
        var values = val.split('.');
        while (/(\d+)(\d{3})/.test(values[0].toString())){
            values[0] = values[0].toString().replace(/(\d+)(\d{3})/, '$1'+','+'$2');
        }
        return values.join('.');
    }
})
    .filter('toCheckSum', function() {
    return function(val) {
        try {
            return Web3.utils.toChecksumAddress(val);
        } catch (err) {
            return val;
        }
    }
})
    .filter('blockies', function() {
    return function(val) {
        return blockies.create({
            seed: val.toLowerCase(),
            size: 8,
            scale: 3
        }).toDataURL();
    }
})
    .filter('compilerVersion', function() {
    return function(val) {
        if (!val) {
            return val;
        }
        return val.replace(/^([^\+]+)(\+commit\.[^\.]+).*$/, '$1$2');
    }
}).directive('ngChecksumAddressValidator', function($filter) {
    return {
        require: 'ngModel',
        scope: {
            ngChecksumAddressValidator: '='
        },
        link: function(scope, elem, attrs, ctrl) {
            ctrl.$formatters.unshift(function (value) {
                return ctrl.$modelValue;
            });
            console.log(scope.ngChecksumAddressValidator);
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
                return value;
            });
        }
    }
}).directive('commaseparator', function($filter, $timeout) {
    var commaSeparateNumber = $filter('separateNumber');
    return {
        require: 'ngModel',
        scope: {
            commaseparator: '='
        },
        link: function(scope, elem, attrs, ctrl) {
            if (!ctrl) {
                return;
            }
            var oldValue;
            ctrl.$formatters.unshift(function(value) {
                oldValue = value;
                return commaSeparateNumber(ctrl.$modelValue);
            });
            ctrl.$parsers.unshift(function(viewValue) {
                var plainNumber = viewValue.replace(/[\,\-\+]/g, '');
                var valid = new RegExp(scope.commaseparator.regexp).test(plainNumber);
                if (!valid) {
                    if (viewValue) {
                        ctrl.$setViewValue(oldValue);
                    }
                }

                if (plainNumber && !isNaN(plainNumber) && ((scope.commaseparator.min !== undefined) || (scope.commaseparator.max !== undefined))) {
                    var val = new BigNumber(plainNumber);

                    var rate = scope.commaseparator.rate || {};
                    rate.min = rate.min || 1;
                    rate.max = rate.max || 1;

                    var minValue = scope.commaseparator.min ? new BigNumber(scope.commaseparator.min).div(rate.min) : false;
                    var maxValue = scope.commaseparator.max ? new BigNumber(scope.commaseparator.max).div(rate.max) : false;

                    var minMaxValidation = (minValue ? val.minus(minValue) >= 0 : true) && (maxValue ? val.minus(maxValue) <= 0 : true);

                    ctrl.$setValidity('min-max', minMaxValidation);
                }

                if (valid || !plainNumber) {
                    oldValue = plainNumber;
                    if (valid) {
                        elem.val(commaSeparateNumber(plainNumber));
                    } else {
                        elem.val('');
                    }
                    return plainNumber;
                } else {
                    if (oldValue) {
                        elem.val(commaSeparateNumber(oldValue));
                    } else {
                        elem.val('');
                    }
                    return oldValue;
                }
            });

            if ((scope.commaseparator.min !== undefined) || (scope.commaseparator.max !== undefined)) {
                scope.$watchGroup(['commaseparator.max', 'commaseparator.min', 'commaseparator.rate'], function(newValue, oldValue) {
                    if (newValue === oldValue) return;
                    $timeout(function() {
                        ctrl.$$parseAndValidate();
                    });
                });
            }

            if (scope.commaseparator.notNull) {
                ctrl.$parsers.unshift(function(value) {
                    if (!value) return;
                    var plainNumber = value.replace(/[\,\.\-\+]/g, '') * 1;
                    ctrl.$setValidity('null-value', !!plainNumber);
                    return value;
                });
            }
            if (scope.commaseparator.checkWith) {
                ctrl.$parsers.push(function(value) {
                    if (!value) return;
                    var plainNumber = new BigNumber(value.replace(/[\,\.\-\+]/g, ''));
                    var checkModelValue = new BigNumber(scope.commaseparator.fullModel[scope.commaseparator.checkWith] || 0);
                    var rangeValues = plainNumber.minus(checkModelValue);
                    var valid = !scope.commaseparator.notEqual ? rangeValues <= 0 : rangeValues < 0;
                    ctrl.$setValidity('check-value', valid);
                    return value;
                });

                ctrl.$formatters.unshift(function(value) {
                    return commaSeparateNumber(ctrl.$modelValue);
                });

                scope.$watch('commaseparator.fullModel.' + scope.commaseparator.checkWith, function() {
                    ctrl.$$parseAndValidate();
                });
            }

            if (scope.commaseparator.autoCheck) {
                $timeout(function() {
                    ctrl.$$parseAndValidate();
                    ctrl.$setTouched();
                });
            }
        }
    };
});



angular.module("datePicker").run(["$templateCache", function($templateCache) {
    $templateCache.put("templates/datepicker.html",
    '<div ng-switch="view"> <div ng-switch-when="date"> <table> <thead> <tr> <th ng-click="prev()">&lsaquo;</th> <th colspan="5" class="switch" ng-click="setView(\'month\')" ng-bind="date|mFormat:\'YYYY MMMM\':tz"></th> <th ng-click="next()">&rsaquo;</i></th> </tr> <tr> <th ng-repeat="day in weekdays" style="overflow: hidden" ng-bind="day|mFormat:\'ddd\':tz"></th> </tr> </thead> <tbody> <tr ng-repeat="week in weeks" ng-init="$index2 = $index"> <td ng-repeat="day in week"> <span ng-class="classes[$index2][$index]" ng-click="selectDate(day)" ng-bind="day|mFormat:\'DD\':tz"></span> </td> </tr> </tbody> </table> </div> <div ng-switch-when="year"> <table> <thead> <tr> <th ng-click="prev(10)">&lsaquo;</th> <th colspan="5" class="switch"ng-bind="years[0].year()+\' - \'+years[years.length-1].year()"></th> <th ng-click="next(10)">&rsaquo;</i></th> </tr> </thead> <tbody> <tr> <td colspan="7"> <span ng-class="classes[$index]" ng-repeat="year in years" ng-click="selectDate(year)" ng-bind="year.year()"></span> </td> </tr> </tbody> </table> </div> <div ng-switch-when="month"> <table> <thead> <tr> <th ng-click="prev()">&lsaquo;</th> <th colspan="5" class="switch" ng-click="setView(\'year\')" ng-bind="date|mFormat:\'YYYY\':tz"></th> <th ng-click="next()">&rsaquo;</i></th> </tr> </thead> <tbody> <tr> <td colspan="7"> <span ng-repeat="month in months" ng-class="classes[$index]" ng-click="selectDate(month)" ng-bind="month|mFormat:\'MMM\':tz"></span> </td> </tr> </tbody> </table> </div> <div ng-switch-when="hours"> <table> <thead> <tr> <th ng-click="prev(24)">&lsaquo;</th> <th colspan="5" class="switch" ng-click="setView(\'date\')" ng-bind="date|mFormat:\'DD MMMM YYYY\':tz"></th> <th ng-click="next(24)">&rsaquo;</i></th> </tr> </thead> <tbody> <tr> <td colspan="7"> <span ng-repeat="hour in hours" ng-class="classes[$index]" ng-click="selectDate(hour)" ng-bind="hour|mFormat:\'HH:mm\':tz"></span> </td> </tr> </tbody> </table> </div> <div ng-switch-when="minutes"> <table> <thead> <tr> <th ng-click="prev()">&lsaquo;</th> <th colspan="5" class="switch" ng-click="setView(\'hours\')" ng-bind="date|mFormat:\'DD MMMM YYYY\':tz"></th> <th ng-click="next()">&rsaquo;</i></th> </tr> </thead> <tbody> <tr> <td colspan="7"> <span ng-repeat="minute in minutes" ng-class="classes[$index]" ng-click="selectDate(minute)" ng-bind="minute|mFormat:\'HH:mm\':tz"></span> </td> </tr> </tbody> </table> </div> </div>'
    );
}]);

//
// var wW = $(window).width();
// var WH = $(window).height();
// var dropCounter = 0;
// var addDrop = function() {
//     dropCounter++;
//     // drop
//     var dp = "<li class='d" + dropCounter + "'></li>";
//     // Ramdon values for X, Y position
//     var dX =  Math.floor((Math.random()*wW)+1) + "px";
//     var dY =  Math.floor((Math.random()*WH)+1) + "px";
//     // Ramdon values for scale
//     var dS = Math.floor((Math.random()*1)+1) * 0.3;
//     // Ramdon values for Opacity, Width and Height
//     var dO = 0.85;
//     var dW = Math.floor(Math.random()*15 + 5);
//     var dH = Math.floor(dW * (Math.min(Math.random(), 0.5) + 1));
//     // Append the drops
//     $(".drops").append(dp);
//     // Apply the random values
//     $(".d" + dropCounter).css("opacity",dO).css("width",dW).css("height",dH).css({
//         left: dX,
//         top:dY,
//         scale: dS,
//         'background-image': 'url(' + imgForDrop + ')'
//     });
// };
//
// var imgForDrop;
// $(function() {
//
//     setTimeout(function() {
//         var node = $('#all-page-wrapper').get(0);
//         domtoimage.toPng(node)
//             .then(function (dataUrl) {
//                 imgForDrop = dataUrl;
//                 $('.bg').css({
//                     'background-image': 'url(' + imgForDrop + ')'
//                 });
//             })
//             .catch(function (error) {
//                 console.error('oops, something went wrong!', error);
//             });
//         setInterval(addDrop, Math.floor(Math.random() * 1000));
//     }, 5000);
//
// });
//
