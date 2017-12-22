'use strict';
var module = angular.module('app');
module.config(function($stateProvider, $locationProvider, $urlRouterProvider) {

    var templatesPath = '/templates/pages/';

    $stateProvider.state('main', {
        abstract: true,
        template: "<div ui-view class='main-wrapper-section'></div>",
        resolve: {
            currentUser: function(usersService, $rootScope) {
                return $rootScope.currentUserDefer.promise;
            }
        }
    }).state('anonymous', {
        url: '/anonymous?:go?',
        template: '',
        title: '',
        resolve: {
            currentUser: function ($rootScope) {
                return $rootScope.currentUserDefer.promise;
            }
        },
        controller: function(currentUser, $state, authService, $stateParams, $location, $rootScope) {
            if (!currentUser) {
                authService.createGhost().then(function(response) {
                    if (!$stateParams.go) {
                        $state.go('main.createcontract.types');
                    } else {
                        $location.url(decodeURIComponent($stateParams.go));
                    }
                });
            } else {
                if (!$stateParams.go) {
                    currentUser.data.contracts ? $state.go('main.contracts.list') : $state.go('main.createcontract.types');
                } else {
                    $location.url(decodeURIComponent($stateParams.go));
                }
            }
        }

    }).state('reset', {
        url: '/reset/:uid/:token/',
        template: '',
        title: ' ',
        controller: function($stateParams) {
            window.location.href = '/auth/reset-password/' + $stateParams.uid + '/' + $stateParams.token;
        }
    }).state('exit', {
        url: '/logout',
        template: '',
        controller: function(authService) {
            authService.logout().then(function() {
                window.location.href = '/auth/';
            });
        }
    }).state('main.base', {
        url: '/',
        controller: function(currentUser, $state) {
            currentUser.data.contracts ? $state.go('main.contracts.list') : $state.go('main.createcontract.types');
        },
        title: 'start'
    }).state('main.profile', {
        url: '/profile',
        controller: 'profileController',
        templateUrl: templatesPath + 'profile.html',
        title: 'Profile',
        resolve: {
        }
    }).state('main.settings', {
        url: '/settings',
        controller: 'settingsController',
        templateUrl: templatesPath + 'settings.html',
        title: 'Settings',
        resolve: {
        }
    }).state('main.messages', {
        url: '/messages',
        controller: 'messagesController',
        templateUrl: templatesPath + 'messages.html',
        resolve: {
        }
    }).state('main.extdevs', {
        url: '/ext-devs',
        controller: 'extDevsController',
        templateUrl: templatesPath + 'ext-devs.html'
    }).state('main.contacts', {
        url: '/contacts',
        controller: 'contactsController',
        templateUrl: templatesPath + 'contacts.html'
    }).state('main.faq', {
        url: '/faq',
        controller: 'faqController',
        templateUrl: templatesPath + 'faq.html',
        resolve: {
        }
    }).state('main.buytokens', {
        url: '/buy',
        controller: 'buytokensController',
        templateUrl: templatesPath + 'buytokens.html',
        data: {
            notAccess: 'is_ghost'
        },
        resolve: {
            currentUser: function(usersService, $rootScope) {
                return $rootScope.currentUserDefer.promise;
            },
            exRate: function(contractService) {
                return contractService.getCurrencyRate({fsym: 'WISH', tsyms: 'ETH,BTC'});
            }
        }
    }).state('main.contracts', {
        abstract: true,
        template: '<div ui-view></div>',
        resolve: {
            contractsList: function(contractService) {
                return contractService.getContractsList();
            },
            openedContract: function() {
                return false;
            }
        }
    }).state('main.contracts.list', {
        url: '/contracts',
        controller: 'contractsController',
        templateUrl: templatesPath + 'contracts.html'
    }).state('main.contracts.preview', {
        url: '/contracts/:id',
        controller: 'contractsController',
        templateUrl: templatesPath + 'contracts.html',
        resolve: {
            openedContract: function(contractService, $stateParams) {
                if (!$stateParams.id) return false;
                return contractService.getContract($stateParams.id);
            }
        },
        title: 'Contract preview',
        parent: 'main.contracts'
    }).state('main.contracts.preview.pay', {
        url: '/pay/',
        data: {
            forPayment: true
        },
        title: 'Contract preview',
        controller: function($stateParams) {
            // console.log($stateParams);
        }

    }).state('main.contracts.preview.deposit', {
        url: '/deposit',
        data: {
            forDeposit: true
        },
        title: 'Contract deposit'

    }).state('main.contracts.preview.finalize', {
        url: '/finalize',
        data: {
            forFinalize: true
        },
        title: 'Contract finalize',
        controller: function($stateParams) {
            // console.log($stateParams);
        }

    }).state('main.contracts.preview.stop', {
        url: '/stop',
        data: {
            forStopping: true
        },
        title: 'Contract stopping'

    }).state('main.createcontract', {
        abstract: true,
        templateUrl: templatesPath + 'createcontract.html'
    }).state('main.createcontract.types', {
        url: '/create',
        controller: function() {

        },
        templateUrl: templatesPath + 'createcontract/contract-types.html'

    }).state('main.createcontract.form', {
        url: '/create/:selectedType?:options?',
        controllerProvider: function($stateParams) {
            return $stateParams.selectedType + 'CreateController';
        },
        templateProvider: function ($templateCache, $stateParams) {
            return $templateCache.get(templatesPath + 'createcontract/' + $stateParams.selectedType + '.html');
        },
        resolve: {
            currencyRate: function(contractService, $stateParams) {
                if ($stateParams.selectedType == 'crowdSale') {
                    return contractService.getCurrencyRate({fsym: 'ETH', tsyms: 'USD'});
                }
                return undefined;
            }
        },
        parent: 'main.createcontract'
        // templateUrl: templatesPath + 'createcontract/contract-types.html'
    });



    $locationProvider.html5Mode({
        enabled: true,
        requireBase: false
    });
    $urlRouterProvider.otherwise('/');

});
