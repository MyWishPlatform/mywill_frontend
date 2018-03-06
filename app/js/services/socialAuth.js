var module = angular.module('Services');
module.service('SocialAuthService', function(authService, API, $q) {

    var openAuthWindow = function(url) {
        var width = 600;
        var height = 400;
        window.open( url, '', 'width=' + width + ',height=' + height + ',left=' + ((window.innerWidth - width)/2) + ',top=' + ((window.innerHeight - height)/2));
    };

    if (window.FB) {
        FB.init({
            appId: '392887687850892',
            status: true,
            cookie: true,
            xfbml: true,
            version: 'v2.8'
        })
    }
    if (window.gapi) {
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
                client_id: '364466470795-a5hkjeu1j743r7ado7u9lo7s89rc4r7q.apps.googleusercontent.com',
                scope: 'email profile openid',
                response_type: 'id_token permission'
            }, onLogged);
        }
    };
});