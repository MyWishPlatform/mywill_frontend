'use strict';
angular.module('Directives', []);
angular.module('Services', []);
angular.module('Filters', []);
angular.module('Constants', []);

var module = angular.module('app', ['Constants', 'ui.router', 'Directives', 'Services', 'Filters', 'ngCookies', 'templates', 'datePicker', 'angular-clipboard']);


module.controller('mainMenuController', function($scope, MENU_CONSTANTS) {
    $scope.menuList = MENU_CONSTANTS;
}).controller('baseController', function($scope, $rootScope) {
    $rootScope.showedMenu = false;
    $rootScope.toggleMenu = function() {
        $rootScope.showedMenu = !$rootScope.showedMenu;
    };
}).controller('headerController', function($rootScope, $scope) {
}).controller('authorizationController', function(authService, $rootScope, $scope, SocialAuthService) {

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
        console.log(form.$valid);
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
        $scope.regRequest.username = $scope.regRequest.email;
        $scope.regServerErrors = undefined;
        authService.registration({
            data: $scope.regRequest
        }).then(function(response) {

        }, function(response) {
            switch (response.status) {
                case 400:
                    $scope.regServerErrors = response.data;
                    break;
            }
        });
    };

}).run(function(APP_CONSTANTS, $rootScope, $window, $timeout, $state, $q, $location, authService,
                MENU_CONSTANTS, $interval, AnalyticsService) {


    var loginWatcherInProgress;
    $rootScope.checkProfile = function(event, requestData) {
        if (loginWatcherInProgress) return;
        loginWatcherInProgress = true;
        authService.profile().then(function(data) {
            $rootScope.setCurrentUser(data.data);
            if (!$rootScope.currentUser.is_ghost) {
                (requestData && requestData.callback) ? requestData.callback(true) : false;
            }
            loginWatcherInProgress = false;
        }, function() {
            loginWatcherInProgress = false;
        });
    };
    $rootScope.$on('$userOnLogin', $rootScope.checkProfile);


    $rootScope.sendEvent = AnalyticsService.sendEvent;
    // AnalyticsService.initGA('UA-103787362-1');

    $rootScope.$location = $location;

    $rootScope.contractTypesIcons = {
        0: 'icon-lastwill',
        1: 'icon-key',
        2: 'icon-deferred',
        3: '',
        4: 'icon-crowdsale'
    };

    $rootScope.deviceInfo = UAParser(window.navigator.userAgent);

    $rootScope.globalProgress = false;
    $rootScope.finishGlobalProgress = false;

    $rootScope.gitHubLink = 'https://github.com/MyWishPlatform/contracts/tree/develop';
    $rootScope.$state = $state;
    $rootScope.numberReplacer = /,/g;
    $rootScope.weiDelta = Math.pow(10, 18);
    $rootScope.setCurrentUser = function(profile) {
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
    var getCurrentUser = function(isGhost) {
        authService.profile().then(function(data) {
            if (data) {
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
            $rootScope.commonOpenedPopup = 'ghost-user-buy-tokens';
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
    $rootScope.generateIdenticon = function(address) {
        return blockies.create({
            seed: address,
            size: 8, // width/height of the icon in blocks, default: 8
            scale: 3
        }).toDataURL();
    };
    var offset = moment().utcOffset() / 60;
    $rootScope.currentTimezone = (offset > 0 ? '+' : '') + offset;

    $rootScope.bigNumber = function(value) {
        if (!value || isNaN(value)) return;
        return new BigNumber(value);
    };

    $rootScope.web3Utils = Web3.utils;

    $rootScope.isProduction = $location.host().indexOf('contracts.mywish.io')>=0;


}).config(function($httpProvider, $qProvider, $compileProvider) {
    $httpProvider.defaults.xsrfCookieName = 'csrftoken';
    $httpProvider.defaults.xsrfHeaderName = 'X-CSRFToken';
    $qProvider.errorOnUnhandledRejections(false);
    $compileProvider.aHrefSanitizationWhitelist(/^\s*(mailto|otpauth|https?):/);
}).filter('declNumber', function($filter) {
    return function(value, words) {
        var float = value % 1;
        value = Math.floor(Math.abs(value));
        var cases = [2, 0, 1, 1, 1, 2];
        return words[float ? 1 : (value % 100 > 4 && value % 100 < 20) ? 2 : cases[(value % 10 < 5) ? value % 10 : 5]];
    }
}).filter('separateNumber', function() {
    return function(val) {
        val = (val || '') + '';
        var values = val.split('.');
        while (/(\d+)(\d{3})/.test(values[0].toString())){
            values[0] = values[0].toString().replace(/(\d+)(\d{3})/, '$1'+','+'$2');
        }
        return values.join('.');
    }
}).directive('commaseparator', function($filter, $timeout) {
    'use strict';
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
