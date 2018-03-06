'use strict';
var module = angular.module('app');
module.config(function($stateProvider, $locationProvider, $urlRouterProvider) {

    var templatesPath = '/templates/pages/';

    $stateProvider.state('main', {
        abstract: true,
        templateUrl: '/templates/common/main.html',
        resolve: {
            currentUser: function($rootScope) {
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
        controller: function(currentUser, $state, authService, $stateParams, $location, $window) {
            if (!currentUser) {
                // $rootScope.setCurrentUser();
                // authService.createGhost().then(function(response) {
                //     if (!$stateParams.go) {
                //         $state.go('main.createcontract.types');
                //     } else {
                //         $location.url(decodeURIComponent($stateParams.go));
                //     }
                // });
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
        template: '<div ui-view></div>'
    }).state('main.contracts.list', {
        url: '/contracts',
        controller: 'contractsController',
        templateUrl: templatesPath + 'contracts.html',
        resolve: {
            currentUser: function($rootScope) {
                return $rootScope.currentUserDefer.promise;
            },
            contractsList: function(contractService, $rootScope) {
                return !$rootScope.currentUser.is_ghost ? contractService.getContractsList() : [];
            }
        }
    }).state('main.contracts.preview', {
        abstract: true,
        controller: 'contractsPreviewController',
        templateUrl: templatesPath + 'contracts/preview.html',
        title: 'Contract preview',
        parent: 'main.contracts'
    }).state('main.contracts.preview.byId', {
        controllerProvider: function(openedContract, CONTRACT_TYPES_NAMES_CONSTANTS) {
            var contractTpl = CONTRACT_TYPES_NAMES_CONSTANTS[openedContract.data.contract_type];
            return contractTpl + 'PreviewController';
        },
        templateProvider: function ($templateCache, openedContract, CONTRACT_TYPES_NAMES_CONSTANTS) {
            var contractTpl = CONTRACT_TYPES_NAMES_CONSTANTS[openedContract.data.contract_type];
            return $templateCache.get(templatesPath + 'contracts/preview/' + contractTpl + '.html');
        },
        url: '/contracts/:id',
        resolve: {
            openedContract: function(contractService, $stateParams) {
                if (!$stateParams.id) return false;
                return contractService.getContract($stateParams.id);
            },
            exRate: function(contractService) {
                return contractService.getCurrencyRate({fsym: 'ETH', tsyms: 'WISH'});
            }
        },
        data: {
            top: 'main.contracts.list'
        }
    }).state('main.createcontract', {
        abstract: true,
        templateUrl: templatesPath + 'createcontract.html',
        controller: function($scope, $rootScope, $window, $q, authService) {

            $scope.checkUserIsGhost = function() {
                if ($rootScope.currentUser.is_ghost) {

                    var defer = $q.defer();

                    /* Open authorisation window */
                    $rootScope.commonOpenedPopup = 'login';
                    $rootScope.commonOpenedPopupParams = {
                        'class': 'login-form',
                        'page': 'registration',
                        'onClose': function() {
                            destroyFocusEvent();
                            $rootScope.closeCommonPopup();
                        },
                        'onLogin': {
                            callback: defer.resolve
                        }
                    };

                    /* Destroy watchers */
                    var destroyFocusEvent = function() {
                        angular.element($window).off('focus', checkWindowFocus);
                    };

                    /* Check profile for window focus */
                    var checkWindowFocus = function() {
                        $rootScope.checkProfile(false, {
                            callback: defer.resolve
                        });
                    };

                    angular.element($window).on('focus', checkWindowFocus);
                    $scope.$on('$destroy', destroyFocusEvent);
                    return defer.promise;
                }
                return false;
            };
        }
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
            exRate: function(contractService) {
                return contractService.getCurrencyRate({fsym: 'ETH', tsyms: 'WISH'});
            },
            currencyRate: function(contractService, $stateParams) {
                if ($stateParams.selectedType === 'crowdSale') {
                    return contractService.getCurrencyRate({fsym: 'ETH', tsyms: 'USD'});
                }
                return undefined;
            },
            openedContract: function() {
                return false;
            },
            tokensList: function($stateParams, contractService) {
                if ($stateParams.selectedType === 'crowdSale') {
                    return contractService.getTokenContracts();
                }
                return undefined;
            }
        },
        parent: 'main.createcontract'
        // templateUrl: templatesPath + 'createcontract/contract-types.html'
    }).state('main.createcontract.edit', {
        url: '/contracts/edit/:id',
        controllerProvider: function(openedContract, CONTRACT_TYPES_NAMES_CONSTANTS) {
            openedContract.data.contract_details.eth_contract = undefined;
            var contractType = CONTRACT_TYPES_NAMES_CONSTANTS[openedContract.data.contract_type];
            return contractType + 'CreateController';
        },
        templateProvider: function ($templateCache, openedContract, CONTRACT_TYPES_NAMES_CONSTANTS) {
            var contractType = CONTRACT_TYPES_NAMES_CONSTANTS[openedContract.data.contract_type];
            return $templateCache.get(templatesPath + 'createcontract/' + contractType + '.html');
        },
        resolve: {
            openedContract: function(contractService, $stateParams) {
                if (!$stateParams.id) return false;
                return contractService.getContract($stateParams.id);
            },
            exRate: function(contractService) {
                return contractService.getCurrencyRate({fsym: 'ETH', tsyms: 'WISH'});
            },
            currencyRate: function(contractService, openedContract, CONTRACT_TYPES_NAMES_CONSTANTS) {
                if (CONTRACT_TYPES_NAMES_CONSTANTS[openedContract.data.contract_type] === 'crowdSale') {
                    return contractService.getCurrencyRate({fsym: 'ETH', tsyms: 'USD'});
                }
                return undefined;
            },
            tokensList: function($stateParams, contractService, CONTRACT_TYPES_NAMES_CONSTANTS, openedContract) {
                if (CONTRACT_TYPES_NAMES_CONSTANTS[openedContract.data.contract_type] === 'crowdSale') {
                    return contractService.getTokenContracts();
                }
                return undefined;
            }
        },
        data: {
            top: 'main.contracts.list'
        }
    });



    $locationProvider.html5Mode({
        enabled: true,
        requireBase: false
    });
    $urlRouterProvider.otherwise('/');

});
