'use strict';
var module = angular.module('app');
module.config(function($stateProvider, $locationProvider, $urlRouterProvider) {

    var templatesPath = '/templates/pages/';

    $stateProvider.state('main', {
        abstract: true,
        template: "<div ui-view class='main-wrapper-section'></div>",
        resolve: {
            currentUser: function(usersService, $q, $state, $rootScope) {
                return $rootScope.currentUserDefer.promise;
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
            currentUser.data.contracts ? $state.go('main.contracts.list') : $state.go('main.createcontract');
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
        resolve: {
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
        title: 'Contract preview'
    }).state('main.contracts.preview.pay', {
        url: '/pay/',
        data: {
            forPayment: true
        },
        title: 'Contract preview',
        controller: function($stateParams) {
            console.log($stateParams);
        }

    }).state('main.contracts.preview.deposit', {
        url: '/deposit',
        data: {
            forDeposit: true
        },
        title: 'Contract deposit'

    }).state('main.contracts.preview.stop', {
        url: '/stop',
        data: {
            forStopping: true
        },
        title: 'Contract stopping'

    }).state('main.createcontract', {
        url: '/create/:id?',
        controller: 'createcontractController',
        templateUrl: templatesPath + 'createcontract.html',
        resolve: {
            // currentContract: function($stateParams) {
            //     if (!$stateParams.id) return;
            //     contractService.getContract()
            // }
        }
    });



    $locationProvider.html5Mode({
        enabled: true,
        requireBase: false
    });
    $urlRouterProvider.otherwise('/');

});
