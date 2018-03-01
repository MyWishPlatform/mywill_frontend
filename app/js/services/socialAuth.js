var module = angular.module('Services');
module.service('SocialAuthService', function(authService, API, $q) {

    var openAuthWindow = function(url) {
        var width = 600;
        var height = 400;
        window.open( url, '', 'width=' + width + ',height=' + height + ',left=' + ((window.innerWidth - width)/2) + ',top=' + ((window.innerHeight - height)/2));
    };

    return {
        facebookAuth: function(callback, errCallback) {
            var checkLoginStatus = function(response, successCallback, errorCallback) {
                if (response.status == 'connected') {
                    successCallback(response.authResponse);
                } else {
                    errorCallback ? errorCallback() : false;
                }
            };
            var onLogged = function(response) {
                authService.auth({
                    path: API.SOCIAL.FACEBOOK,
                    data: {
                        'access_token': response.accessToken
                    }
                }).then(function(response) {
                    callback ? callback(response) : false;
                });
            };
            var openLoginDialog = function() {
                FB ? FB.login(function(response) {
                    checkLoginStatus(response, onLogged, false);
                }) : false;
            };
            FB ? FB.getLoginStatus(function(response) {
                console.log(response);
                checkLoginStatus(response, onLogged, openLoginDialog);
            }) : false;
        },
        twitterAuth: function() {
            openAuthWindow(API.SOCIAL.POPUP_URLS.TWITTER);
        },
        vkAuth: function() {
            openAuthWindow(API.SOCIAL.POPUP_URLS.VK);
        },
        googleAuth: function() {
            openAuthWindow(API.SOCIAL.POPUP_URLS.GOOGLE);
        }
    };
});