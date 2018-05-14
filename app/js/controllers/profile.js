angular.module('app').controller('profileController', function($scope, authService, $state) {

    var enablePopUpParams = {
        template: '/templates/popups/confirmations/enable-2fa.html',
        newPopupContent: true,
        class: 'deleting-contract',
        actions: {
            enable2fa: function(code, form) {
                if (!form.$valid) return;
                enablePopUpParams.params.error = undefined;
                authService.enable2fa({
                    totp: code
                }).then(function() {
                    enablePopUpParams.params.error = undefined;
                    $scope.currentUser.use_totp = true;
                    $scope.$broadcast('$closePopUps');
                }, function() {
                    enablePopUpParams.params.error = 'INVALID_2FA_CODE';
                });
            },
            resetError: function() {
                enablePopUpParams.params.error = undefined;
            }
        }
    };

    $scope.enableInstructionPopUpParams = {
        class: 'conditions',
        newPopupContent: true,
        template: '/templates/popups/instructions/2fa/enable-2fa-instruction.html',
        params: {
            confirmEnablePopUp: enablePopUpParams
        }
    };

    $scope.disablePopUpParams = {
        class: 'deleting-contract',
        template: '/templates/popups/confirmations/disable-2fa.html',
        newPopupContent: true,
        actions: {
            disable2fa: function(code, form) {
                if (!form.$valid) return;
                $scope.disablePopUpParams.params.error = undefined;
                authService.disable2fa({
                    totp: code
                }).then(function() {
                    generateKey();
                    $scope.disablePopUpParams.params.error = undefined;
                    $scope.currentUser.use_totp = false;
                    $scope.$broadcast('$closePopUps');
                }, function() {
                    $scope.disablePopUpParams.params.error = 'INVALID_2FA_CODE';
                });
            },
            resetError: function() {
                $scope.disablePopUpParams.params.error = undefined;
            }
        }
    };

    var generateKey = function() {
        authService.generate2fa().then(function(response) {
            var data = response.data;
            var url = 'otpauth://totp/Secure%20App:' + data.user + '?issuer=' + data.issuer + '%20App&secret=' + data.secret;
            var qr = new QRious({
                level: 'Q',
                padding: 0,
                size: 200,
                backgroundAlpha: 0,
                value: url
            });
            $scope.enableInstructionPopUpParams.params.url = url;
            $scope.enableInstructionPopUpParams.params.imgUrl = qr.toDataURL();
        });
    };
    if (!$scope.currentUser.use_totp) {
        generateKey();
    }


    $scope.passwordParams = {};
    var passwordChangeProgress = false;
    $scope.setNewPassword = function(form) {
        if (!form.$valid || passwordChangeProgress) return;
        passwordChangeProgress = true;
        $scope.serverErrors = undefined;
        authService.setNewPassword($scope.passwordParams).then(function() {
            $state.transitionTo($state.current, {}, {
                reload: true,
                inherit: false,
                notify: true
            });
        }, function(response) {
            switch (response.status) {
                case 400:
                    $scope.serverErrors = response.data;
                    break;
            }
            passwordChangeProgress = false;
        });
    };
});