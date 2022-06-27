'use strict';
angular.module('Directives', []);
angular.module('Services', []);
angular.module('Filters', []);
angular.module('Constants', []);

var module = angular.module('app', [
    'Constants', 'ui.router', 'Directives', 'Services', 'Filters', 'ngCookies', 'templates',
    'datePicker', 'angular-clipboard', 'ngFileSaver', 'pascalprecht.translate', 'ngWebworker']);
if (UAParser(window.navigator.userAgent).device.type === "mobile") {
    module.requires.push('ngTouch');
}

module.controller('mainMenuController', function($scope, MENU_CONSTANTS) {
    $scope.menuList = MENU_CONSTANTS;
}).controller('baseController', function($scope, $rootScope, $translate, $timeout, $cookies, authService) {
    $rootScope.showedMenu = false;

    $timeout(function() {
        $rootScope.eoslynx = !!$cookies.get('eoslynx');
        if (window['lynxMobile']) {
            $rootScope.eoslynxIsMobile = true;
        } else {
            window.addEventListener("lynxMobileLoaded", function() {
                $rootScope.eoslynxIsMobile = true;
            });
        }
    });

    $scope.notCookiesAccept = !$cookies.get('cookies-accept');
    $scope.closeCookiesInfo = function(withoutCookie) {
        $scope.notCookiesAccept = false;
        if (!withoutCookie) {
            $cookies.put('cookies-accept', '1');
        }
    };

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
        },
        'zh': {
            'name': '中国',
            'icon': 'zh'
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

}).run(function(APP_CONSTANTS, $rootScope, $window, $timeout, $state, $q, $location, authService,
                MENU_CONSTANTS, $interval, $cookies, WebSocketService, ENV_VARS) {

    $rootScope.testing = $location.$$hash === 'forTest';

    $rootScope.testAddresses = {
        "ETH": "0xD0593B233Be4411A236F22b42087345E1137170b",
        "BNB": "0xD0593B233Be4411A236F22b42087345E1137170b",
        "MATIC": "0xD0593B233Be4411A236F22b42087345E1137170b",
        "XINFIN": "0xD0593B233Be4411A236F22b42087345E1137170b",
        "HECOCHAIN": "0xD0593B233Be4411A236F22b42087345E1137170b",
        "MOONRIVER": "0xD0593B233Be4411A236F22b42087345E1137170b",
        "SOLANA": "HtHf9rJbEeWwpmAbNwZAg5H6sBkRRgwfpLE9ZpysiuQ9",
        "EOS": "mywishtestac",
        "TRON": "TRBeBGSyKrVMts1ZQz45JRu9mxCwEhgPSg",
        "NEO": "NXf4VLBrjUXKtk8NNkeY1zymmbUeQ9RkUu",
        "RSK": "0xa441b5438885c9b5879e7dfa885b5d1b97216d69",
        "NEAR": "mywish.testnet",
    };


    $rootScope.sitemode = ENV_VARS.mode;
    $rootScope.getNetworkPath = function(network) {
        network *= 1;
        switch (network) {
            case 1:
            case 2:
                return 'eth';
            case 3:
            case 4:
                return 'rsk';
            case 5:
            case 6:
                return 'neo';
            case 10:
            case 11:
                return 'eos';
            case 14:
            case 15:
                return 'tron';
            case 22:
            case 23:
                return 'bnb';
            case 24:
            case 25:
                return 'matic';
            case 35:
                return 'xinfin';
            case 28:
            case 36:
                return 'hecochain';
            case 37:
                return 'moonriver';
            case 38:
            case 39:
                return 'solana';
            case 40:
                return 'near';
        }
    };

    $rootScope.max = Math.max;
    $rootScope.min = Math.min;
    $rootScope.pow = Math.pow;

    $rootScope.web3Utils = window.Web3 ? window.Web3.utils : false;


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

    $rootScope.globalProgress = false;
    $rootScope.finishGlobalProgress = false;

    $rootScope.$state = $state;

    var defaultLng = (navigator.language||navigator.browserLanguage).split('-')[0];
    $rootScope.setCurrentUser = function(profile) {

        if (profile.lang) {
            $rootScope.setLanguage(profile.lang, true);
        } else {
            var lng = $cookies.get('lang') || ($rootScope.languagesList[defaultLng] ? defaultLng : 'en');
            $rootScope.setLanguage(lng);
        }



        switch (ENV_VARS.mode) {
            case 'eos':
                profile.visibleBalance = (new BigNumber(profile.balance)).div(Math.pow(10, 4)).toFormat(2);
                break;
            case 'tron':
                profile.visibleBalance = (new BigNumber(profile.balance)).div(Math.pow(10, 6)).toFormat(2);
                break;
            default:
                profile.visibleBalance = (new BigNumber(profile.balance)).div(Math.pow(10, 18)).toFormat(2);
                profile.visibleBalanceUSDT = (new BigNumber(profile.usdt_balance.split('.')[0])).div(Math.pow(10, 6)).toFormat(2);
                break;
        }

        profile.balanceInRefresh = $rootScope.currentUser ? $rootScope.currentUser.balanceInRefresh : false;
        $rootScope.currentUser = profile;
        return profile;
    };

    $rootScope.getTemplate = function(template) {
        return APP_CONSTANTS.TEMPLATES.PATH + '/' + template + '.html';
    };

    var dateRange = 0;

    $rootScope.getNowDateTime = function(isMoment) {
        var dateTime = new Date((new Date()).getTime() + dateRange);
        if (!isMoment) {
            return dateTime;
        } else {
            return moment(dateTime);
        }

    };

    var getCurrentUser = function() {
        authService.profile().then(function(data) {
            if (data) {
                // console.log('getCurrentUser',data)
                dateRange = (new Date(data.headers('date'))).getTime() - (new Date()).getTime();
                $rootScope.setCurrentUser(data.data);
                iniApplication();
                $rootScope.currentUserDefer.resolve(data);
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

    $rootScope.currentUserDefer = $q.defer();

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

    $rootScope.hideGlobalError = function() {
        if ($rootScope.globalError.onclick) {
            $rootScope.globalError.onclick();
        }
        $rootScope.globalError = false;
    };


    $rootScope.successCodeCopy = function(contract, field) {
        contract.copied = contract.copied || {};
        contract.copied[field] = true;
        $timeout(function() {
            contract.copied[field] = false;
        }, 1000);
    };

}).controller('birthdayController', function($scope) {
    console.log($scope.contract);
    var btn = jQuery("#share");
    var contractDetails = $scope.contract.contract_details;

    if (contractDetails.eth_contract) {
        $scope.contractInfoPath = 'eth_contract';
    } else if (contractDetails.eth_contract_crowdsale) {
        $scope.contractInfoPath = 'eth_contract_crowdsale';
    } else if (contractDetails.eth_contract_token) {
        $scope.contractInfoPath = 'eth_contract_token';
    } else if (contractDetails.eos_contract) {
        $scope.contractInfoPath = 'eos_contract';
    } else if (contractDetails.eos_contract_crowdsale) {
        $scope.contractInfoPath = 'eos_contract_crowdsale';
    } else if (contractDetails.eos_contract_token) {
        $scope.contractInfoPath = 'eos_contract_token';
    } else if (contractDetails.tron_contract) {
        $scope.contractInfoPath = 'tron_contract';
    } else if (contractDetails.tron_contract_crowdsale) {
        $scope.contractInfoPath = 'tron_contract_crowdsale';
    } else if (contractDetails.tron_contract_token) {
        $scope.contractInfoPath = 'tron_contract_token';
    } else if (contractDetails.neo_contract) {
        $scope.contractInfoPath = 'neo_contract';
    } else if (contractDetails.neo_contract_crowdsale) {
        $scope.contractInfoPath = 'neo_contract_crowdsale';
    } else if (contractDetails.neo_contract_token) {
        $scope.contractInfoPath = 'neo_contract_token';
    } else if (contractDetails.rsk_contract) {
        $scope.contractInfoPath = 'rsk_contract';
    } else if (contractDetails.rsk_contract_crowdsale) {
        $scope.contractInfoPath = 'rsk_contract_crowdsale';
    } else if (contractDetails.rsk_contract_token) {
        $scope.contractInfoPath = 'rsk_contract_token';
    }


    jQuery(function() {
        btn.jsSocials({
            shares: ["twitter", "facebook", "linkedin"],
            url: btn.data('url'),
            text: "I've created a smart contract via @mywishplatform #MyWish3years",
            shareIn: "popup",
            hashtags: "MyWish3years"
        });
    });

})
    .config(function($httpProvider, $qProvider, $compileProvider, $translateProvider) {
        $httpProvider.defaults.xsrfCookieName = 'csrftoken';
        $httpProvider.defaults.xsrfHeaderName = 'X-CSRFToken';
        $qProvider.errorOnUnhandledRejections(false);
        $compileProvider.aHrefSanitizationWhitelist(/^\s*(mailto|otpauth|https?):/);
        $translateProvider.useStaticFilesLoader({
            prefix: '/static/i18n/',
            suffix: '.json?_=' + (new Date()).getTime()
        });
    });

