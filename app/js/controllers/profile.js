angular.module('app').controller('profileController', function($scope, authService, $state) {

    $scope.twoFactor  = $scope.currentUser.use_totp;

    var enablePopUpParams = {
        template: '/templates/popups/enable-2fa.html',
        class: 'deleting-contract',
        params: {
            withoutCloser: true
        },
        actions: {
            enable2fa: function(code) {
                enablePopUpParams.params.error = undefined;
                authService.enable2fa({
                    totp: code
                }).then(function() {
                    enablePopUpParams.params.error = undefined;
                    $scope.currentUser.use_totp = true;
                    $scope.$broadcast('$closePopUps');
                }, function() {
                    enablePopUpParams.params.error = 'Неверный код. Повторите попытку';
                });
            }
        }
    };

    $scope.enableInstructionPopUpParams = {
        class: 'conditions',
        template: '/templates/popups/enable-2fa-instruction.html',
        params: {
            withoutCloser: true,
            confirmEnablePopUp: enablePopUpParams
        }
    };

    $scope.disablePopUpParams = {
        class: 'deleting-contract',
        template: '/templates/popups/disable-2fa.html',
        params: {
            withoutCloser: true,
            actions: {
                disable2fa: function(code) {
                    enablePopUpParams.params.error = undefined;
                    authService.disable2fa({
                        totp: code
                    }).then(function() {
                        generateKey();
                        enablePopUpParams.params.error = undefined;
                        $scope.currentUser.use_totp = false;
                        $scope.$broadcast('$closePopUps');
                    }, function() {
                        $scope.disablePopUpParams.params.error = 'Неверный код. Повторите попытку';
                    });
                }
            }
        }
    };

    var generateKey = function() {
        authService.generate2fa().then(function(response) {
            var data = response.data;
            var url = 'otpauth://totp/Secure%20App:' + data.user + '?issuer=' + data.issuer + '%20App&secret=' + data.secret;
            var qr = new QRious({
                // level: 'H',
                padding: 0,
                size: 266,
                value: url
            });
            $scope.enableInstructionPopUpParams.params.imgUrl = qr.toDataURL();
        });
    };
    if (!$scope.currentUser.use_totp) {
        generateKey();
    }


    $scope.passwordParams = {};
    var passwordChangeProgress = false;
    $scope.setNewPassword = function(form) {
        console.log(form);
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