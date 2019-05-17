var module = angular.module('Services');
module.service('SocialAuthService', function(authService, API, $q, APP_CONSTANTS, $rootScope, requestService) {

    var googleAppId = APP_CONSTANTS.SOCIAL_APP_ID.GOOGLE;
    var facebookAppId = APP_CONSTANTS.SOCIAL_APP_ID.FACEBOOK;

    var openAuthWindow = function(url) {
        var width = 600;
        var height = 400;
        window.open( url, '', 'width=' + width + ',height=' + height + ',left=' + ((window.innerWidth - width)/2) + ',top=' + ((window.innerHeight - height)/2));
    };



    $rootScope.MMInited = !!window['ethereum'];

    if (window.FB) {
        $rootScope.FBInited = true;
        FB.init({
            appId: facebookAppId,
            status: true,
            cookie: true,
            xfbml: true,
            version: 'v2.8'
        })
    }
    if (window.gapi) {
        $rootScope.GAInited = true;
        gapi.load('auth2');
    }

    return {
        facebookAuth: function(callback, errCallback, advancedData) {
            var checkLoginStatus = function(response, successCallback, errorCallback) {
                if (response.status == 'connected') {
                    successCallback(response.authResponse);
                } else {
                    errorCallback ? errorCallback() : false;
                }
            };
            var onLogged = function(response) {
                var requestData = {
                    'access_token': response.accessToken || response.access_token,
                    'totp': response.totp
                };
                authService.auth({
                    path: API.SOCIAL.FACEBOOK,
                    data: requestData
                }).then(function(response) {
                    callback ? callback(response) : false;
                }, function(response) {
                    errCallback(response, requestData, 'facebook');
                });
            };
            if (advancedData) {
                onLogged(advancedData);
                return;
            }
            var openLoginDialog = function() {
                FB ? FB.login(function(response) {
                    checkLoginStatus(response, onLogged, false);
                }) : false;
            };
            FB ? FB.getLoginStatus(function(response) {
                checkLoginStatus(response, onLogged, openLoginDialog);
            }) : false;
        },
        twitterAuth: function() {
            openAuthWindow(API.SOCIAL.POPUP_URLS.TWITTER);
        },
        vkAuth: function() {
            openAuthWindow(API.SOCIAL.POPUP_URLS.VK);
        },
        googleAuth: function(callback, errCallback, advancedData) {
            var onLogged = function(response) {
                var requestData = {
                    'access_token': response.access_token,
                    'totp': response.totp
                };
                authService.auth({
                    path: API.SOCIAL.GOOGLE,
                    data: requestData
                }).then(function(response) {
                    callback ? callback(response) : false;
                }, function(response) {
                    errCallback(response, requestData, 'google');
                });
            };
            if (advancedData) {
                onLogged(advancedData);
                return;
            }

            gapi.auth2.authorize({
                client_id: googleAppId,
                scope: 'email profile',
                response_type: 'id_token permission',
                prompt: 'select_account'
            }, onLogged);
        },
        metaMaskAuth: function(data, callback, errCallback, advancedData) {
            var requestData = angular.merge(data, advancedData || {});
            authService.auth({
                path: 'metamask/',
                data: requestData
            }).then(function(response) {
                callback ? callback(response) : false;
            }, function(response) {
                errCallback(response, requestData, 'google');
            });
        },
        getMetaMaskAuthMsg: function() {
            var params = {
                path: 'get_metamask_message/'
            };
            return requestService.get(params);
        }
    };
});

