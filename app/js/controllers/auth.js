angular.module('app').controller('authController', function (authService, $rootScope, $scope, SocialAuthService, $timeout, $cookies) {
    $scope.twoFAEnabled = false;
    $scope.request = {};
    $scope.loginRequest = {};

    $scope.$parent.socialAuthError = false;

    var checkLoginAction = function(reloadPage, inService) {
        if (inService) {
            onAuth();
            return;
        }
        if (!reloadPage) {
            window.location = '/';
        } else {
            $state.transitionTo($state.current, {}, {
                reload: true,
                inherit: false,
                notify: true
            });
        }
    };

    $scope.sendLoginForm = function(authForm, reloadPage, inService) {
        if (!authForm.$valid) return;
        $scope.logInServerErrors = undefined;
        authService.auth({
            data: $scope.loginRequest
        }).then(function (response) {
            checkLoginAction(reloadPage, inService);
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

    $scope.socialAuthError = false;
    var onAuth = function(response) {
        $rootScope.$broadcast('$userOnLogin', $scope.ngPopUp.params.onLogin || false);
        $scope.closeCurrentPopup();
        $scope.closeCommonPopup();
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

    var metaMaskAuthRequest = function(advancedData, reloadPage, inService) {
        SocialAuthService.metaMaskAuth({
            address: advancedData.address,
            signed_msg: advancedData.signature
        }, function(response) {
            checkLoginAction(reloadPage, inService);
        }, errorSocialAuth, advancedData);
    };

    $scope.mmLogin = function(advancedData, reloadPage, inService) {

        var web3 = new window['Web3']();
        web3.setProvider(window['ethereum']);

        window['ethereum'].enable().then(function(accounts) {
            SocialAuthService.getMetaMaskAuthMsg().then(function(response) {
                var msg = response.data;
                var address = accounts[0];
                web3.eth.personal.sign(
                    msg,
                    address,
                    undefined,
                    function(signError, signature) {
                        if (!signError) {
                            metaMaskAuthRequest({
                                address: address,
                                signed_msg: signature
                            }, reloadPage, inService);
                        } else {
                            // console.log(signError);
                        }
                    }
                );
            });
        });
    };


    $scope.fbLogin = function(advancedData, reloadPage, inService) {
        SocialAuthService.facebookAuth(function(response) {
            checkLoginAction(reloadPage, inService);
        }, errorSocialAuth, advancedData);
    };
    $scope.googleLogin = function(advancedData, reloadPage, inService) {
        SocialAuthService.googleAuth(function(response) {
            checkLoginAction(reloadPage, inService);
        }, errorSocialAuth, advancedData);
    };
    $scope.continueSocialAuth = function(form, reloadPage, inService) {
        if (!form.$valid) return;
        switch ($scope.socialAuthInfo.network) {
            case 'google':
                $scope.googleLogin($scope.socialAuthInfo.request, reloadPage, inService);
                break;
            case 'facebook':
                $scope.fbLogin($scope.socialAuthInfo.request, reloadPage, inService);
                break;
            case 'metamask':
                metaMaskAuthRequest($scope.socialAuthInfo.request, reloadPage, inService);
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

    /* Registration */
    $scope.regRequest = {};
    $scope.regServerErrors = undefined;

    $scope.sendRegForm = function(regForm) {
        if (!regForm.$valid) return;
        $scope.regRequest.email = $scope.regRequest.username;
        $scope.regServerErrors = undefined;
        authService.registration({
            data: $scope.regRequest
        }).then(function(response) {
            $scope.ngPopUp.params.page = 'email-confirm';
        }, function(response) {
            switch (response.status) {
                case 400:
                    $scope.regServerErrors = response.data;
                    break;
            }
        });
    };

    /* Resend email */
    var startTimerTime = $cookies.get('latest-email-request');
    var sentConfirmProgress = false;
    $scope.timerSeconds = 0;
    var requestTimeLength = 60;


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

    $scope.getConfirmEmail = function(email) {
        if (sentConfirmProgress) return;
        sentConfirmProgress = true;

        authService.resendConfirmEmail(email || $scope.regRequest.email).then(function() {
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
});