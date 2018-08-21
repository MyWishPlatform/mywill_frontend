'use strict';
angular.module('Services', []);
angular.module('Constants', []);
angular.module('Directives', []);


var module = angular.module('app', ['Constants', 'ui.router', 'Services', 'ngCookies', 'templates', 'Directives', 'pascalprecht.translate']);

module.controller('baseController', function($scope, $translate, $cookies) {

    var languagesList = {
        'ja': {
            'name': '日本語',
            'icon': 'ja'
        },
        'en': {
            'name': 'English',
            'icon': 'us'
        },
        'zh': {
            'name': '中國',
            'icon': 'zh'
        }
    };

    var defaultLng = $cookies.get('lang') || ((navigator.language||navigator.browserLanguage).split('-')[0]);
    $scope.setLanguage = function(lng) {
        $scope.language = languagesList[lng] ? lng : 'en';
        $translate.use($scope.language).then(function() {
            $scope.pageLoaded = true;
        });
        $cookies.put('lang', $scope.language, {path: '/'});
    };
    $scope.setLanguage(defaultLng);
}).config(function($stateProvider, $locationProvider, $urlRouterProvider, $translateProvider) {
    $translateProvider.useStaticFilesLoader({
        prefix: '/static/i18n/auth-',
        suffix: '.json'
    });

    var templatesPath = '/templates/login/';

    $stateProvider.state('main', {
        abstract: true,
        template: "<div ui-view class='main-wrapper-section'></div>",
        controller: function(authService, $rootScope, $scope, SocialAuthService) {
            authService.profile().then(function(response) {
                var profile = response.data;
                if (!profile.is_ghost) {
                    window.location = '/';
                } else {
                    $rootScope.onCheck = true;
                }
            }, function(response) {
                $rootScope.onCheck = true;
            });
        }
    }).state('main.login', {
        url: '/',
        templateUrl: templatesPath + 'auth.html',
        controller: 'authController'
    }).state('main.forgot', {
        url: '/forgot-password',
        templateUrl: templatesPath + 'forgot-password.html',
        controller: function ($scope, authService) {
            $scope.request = {};
            $scope.sendResetPassForm = function(resetForm) {
                if (!resetForm.$valid) return;
                $scope.serverErrors = undefined;
                $scope.successText = false;
                authService.passwordReset($scope.request.email).then(function (response) {
                    $scope.successText = response.data.detail;
                }, function (response) {
                    switch (response.status) {
                        case 400:
                            $scope.serverErrors = response.data;
                            break;
                    }
                });
            }
        }
    }).state('main.registration', {
        url: '/registration',
        templateUrl: templatesPath + 'registration.html',
        controller: function ($scope, authService, $state, $cookies) {
            $scope.request = {};
            $scope.$parent.socialAuthError = false;
            $scope.sendRegForm = function(regForm) {
                if (!regForm.$valid) return;
                $scope.request.email = $scope.request.username;
                $scope.serverErrors = undefined;
                authService.registration({
                    data: $scope.request
                }).then(function(response) {
                    $cookies.put('confirm-eml', $scope.request.email);
                    $state.go('main.confirm');
                }, function(response) {
                    switch (response.status) {
                        case 400:
                            $scope.serverErrors = response.data;
                            break;
                    }
                });
            };
        }
    }).state('main.reset', {
        url: '/reset-password/:uid/:token',
        templateUrl: templatesPath + 'reset-password.html',
        controller: function ($scope, authService, $state, $stateParams) {
            $scope.request = {
                uid: $stateParams.uid,
                token: $stateParams.token
            };
            $scope.sendConfirmPass = function(passForm) {
                if (!passForm.$valid) return;
                authService.passwordChange($scope.request).then(function() {
                    $state.go('main.login');
                }, function (response) {
                    switch (response.status) {
                        case 400:
                            $scope.serverErrors = response.data;
                            break;

                        case 403:
                            switch (response.data.detail) {
                                case '1021':
                                    $scope.twoFAEnabled = true;
                                    break;
                                case '1022':
                                    $scope.serverErrors = {totp: 'Invalid code'};
                                    break;
                            }
                            break;
                    }
                });
            };

        }
    }).state('main.confirm', {
        url: '/notification',
        templateUrl: templatesPath + 'email-confirm.html',
        controller: function($scope, $timeout, $cookies, $state, authService) {
            $scope.emailConfirmProgress = false;
            $scope.timerSeconds = 0;
            var requestTimeLength = 60;

            $scope.currEmail = $cookies.get('confirm-eml');

            if (!$scope.currEmail) {
                $state.go('main.registration');
                return;
            }

            var startTimerTime = $cookies.get('latest-email-request');


            var checkTimer = function() {
                $scope.allTimerSeconds = requestTimeLength - Math.round(((new Date()).getTime() - startTimerTime) / 1000);
                $scope.timerSeconds = $scope.allTimerSeconds%60;
                $scope.timerMinutes = Math.floor($scope.allTimerSeconds/60);
                $scope.timerSeconds = ($scope.timerSeconds < 10 ? '0' : '') + $scope.timerSeconds;
                $scope.timerMinutes = ($scope.timerMinutes < 10 ? '0' : '') + $scope.timerMinutes;

                if ($scope.allTimerSeconds <= 0) {
                    $scope.emailConfirmProgress = false;
                    $cookies.put('latest-email-request');
                } else {
                    $timeout(checkTimer, 300);
                }
            };

            var sentConfirmProgress;
            $scope.getConfirmEmail = function() {
                if (sentConfirmProgress) return;
                sentConfirmProgress = true;

                authService.resendConfirmEmail($scope.currEmail).then(function() {
                    startTimerTime = (new Date()).getTime();
                    $cookies.put('latest-email-request', startTimerTime);
                    $scope.emailConfirmProgress = true;
                    sentConfirmProgress = false;
                    checkTimer();
                }, function(response) {
                    sentConfirmProgress = false;
                    switch (response.status) {
                        case 403:
                            $scope.resendError = response.data.detail;
                            break;
                    }
                });
            };

            if (startTimerTime) {
                $scope.emailConfirmProgress = true;
                checkTimer();
            }
        }
    });
    $locationProvider.html5Mode({
        enabled: true,
        requireBase: false
    });
}).run(function($state, $rootScope) {
    $rootScope.$state = $state;
}).config(function($httpProvider, $qProvider) {
    $httpProvider.defaults.xsrfCookieName = 'csrftoken';
    $httpProvider.defaults.xsrfHeaderName = 'X-CSRFToken';
    $qProvider.errorOnUnhandledRejections(false);
});
