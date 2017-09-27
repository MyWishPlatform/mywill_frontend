'use strict';
angular.module('Services', []);
angular.module('Constants', []);

var module = angular.module('app', ['Constants', 'ui.router', 'Services', 'ngCookies', 'templates']);


module.controller('authController', function($scope) {

}).config(function($stateProvider, $locationProvider, $urlRouterProvider) {

    var templatesPath = '/templates/login/';

    $stateProvider.state('main', {
        abstract: true,
        template: "<div ui-view class='main-wrapper-section'></div>",
        controller: function(authService, $rootScope) {

            authService.profile().then(function(response) {
                window.location = '/dashboard/';
            }, function(response) {
                $rootScope.onCheck = true;
            });
        }
    }).state('main.login', {
        url: '/',
        templateUrl: templatesPath + 'auth.html',
        controller: function ($scope, authService) {
            $scope.request = {};
            $scope.sendLoginForm = function(authForm) {
                if (!authForm.$valid) return;
                $scope.serverErrors = undefined;

                authService.auth({
                    data: $scope.request
                }).then(function (response) {
                    window.location = '/dashboard/';
                }, function (response) {
                    switch (response.status) {
                        case 400:
                            $scope.serverErrors = response.data;
                            break;
                    }
                });
            }
        }
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
                    // window.location = '/';
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
        controller: function ($scope, authService, $state) {
            $scope.request = {};

            $scope.sendRegForm = function(regForm) {
                if (!regForm.$valid) return;
                $scope.request.username = $scope.request.email;
                $scope.serverErrors = undefined;
                authService.registration({
                    data: $scope.request
                }).then(function(response) {
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
                    }
                });
            };

        }
    }).state('main.confirm', {
        url: '/notification',
        templateUrl: templatesPath + 'email-confirm.html'
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
