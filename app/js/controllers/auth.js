angular.module('app').controller('authController', function (authService, $rootScope, $scope, SocialAuthService, $timeout, $cookies) {
    $scope.twoFAEnabled = false;
    $scope.request = {};

    $scope.$parent.socialAuthError = false;
    $scope.sendLoginForm = function(authForm, reloadPage, inService) {
        if (!authForm.$valid) return;
        $scope.serverErrors = undefined;
        authService.auth({
            data: $scope.request
        }).then(function (response) {
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
        }, function (response) {
            switch (response.status) {
                case 400:
                    $scope.serverErrors = response.data;
                    break;
                case 403:
                    switch (response.data.detail) {
                        case '1019':
                            $scope.twoFAEnabled = true;
                            break;
                        case '1020':
                            $scope.serverErrors = {totp: 'Invalid code'};
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

    $scope.fbLogin = function(advancedData) {
        SocialAuthService.facebookAuth(onAuth, errorSocialAuth, advancedData);
    };
    $scope.googleLogin = function(advancedData) {
        SocialAuthService.googleAuth(onAuth, errorSocialAuth, advancedData);
    };
    $scope.continueSocialAuth = function(form) {
        if (!form.$valid) return;
        switch ($scope.socialAuthInfo.network) {
            case 'google':
                $scope.googleLogin($scope.socialAuthInfo.request);
                break;
            case 'facebook':
                $scope.fbLogin($scope.socialAuthInfo.request);
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

    $scope.getConfirmEmail = function() {
        if (sentConfirmProgress) return;
        sentConfirmProgress = true;

        authService.resendConfirmEmail($scope.regRequest.email).then(function() {
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