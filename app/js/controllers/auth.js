angular.module('app').controller('authController', function ($scope, authService, $state) {
    $scope.twoFAEnabled = false;
    $scope.request = {};

    $scope.$parent.socialAuthError = false;
    $scope.sendLoginForm = function(authForm, reloadPage) {
        if (!authForm.$valid) return;
        $scope.serverErrors = undefined;
        authService.auth({
            data: $scope.request
        }).then(function (response) {
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
    }
});