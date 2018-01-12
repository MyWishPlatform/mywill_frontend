var module = angular.module('Directives');
module.directive('ngTimePicker', function($rootScope, $timeout, $window) {
    return {
        restrict: 'A',
        require: 'ngModel',
        templateUrl: $rootScope.getTemplate('directives/ngTimePicker'),
        replace: true,
        scope: {
            ngTimePicker: '=',
            ngChange: '=',
            ngChangeData: '=',
            ngModel: '='
        },
        link: function($scope, element, attr, ngModel) {

            $scope.hours = [];
            $scope.hours[23] = true;
            $scope.minutes = [];
            $scope.minutes[59] = true;

            $scope.idFIeld = new Date().getTime() + '_' + Math.round(10000000 * Math.random());

            $scope.closeTimePicker = function(event) {
                $scope.activated = false;
            };

            $scope.activateTimePicker = function() {
                $scope.activated = true;
            };

            var timer;

            var setValue = function() {
                ngModel.$setViewValue({
                    hours: $scope.values.currentHour,
                    minutes: $scope.values.currentMinute
                });
            };

            $scope.$watch('ngModel', function() {
                $scope.values = {
                    currentHour: $scope.ngModel.hours || 0,
                    currentMinute: $scope.ngModel.minutes || 0
                };
                $scope.ngChange ? $scope.ngChange($scope.ngChangeData || undefined) : false;
            });

            var upFunc = function() {
                $timeout.cancel(timer);
                angular.element($window).off('mouseup', upFunc);
                setValue();
                $scope.$apply();
            };

            var iniWindowHandler = function() {
                angular.element($window).on('mouseup', upFunc)
            };

            $scope.hourChangeUp = function(timeout, noRepeat) {
                if (!timeout) iniWindowHandler();
                $scope.values.currentHour++;
                timeout = Math.max(70, (timeout || 900) / 2);
                $scope.values.currentHour = $scope.values.currentHour > 23 ? 0 : $scope.values.currentHour;
                if (noRepeat) return;
                timer = $timeout(function() {
                    $scope.hourChangeUp(timeout);
                }, timeout);
            };

            $scope.hourChangeDown = function(timeout, noRepeat) {
                if (!timeout) iniWindowHandler();
                $scope.values.currentHour--;
                timeout = Math.max(70, (timeout || 900) / 2);
                $scope.values.currentHour = $scope.values.currentHour < 0 ? 23 : $scope.values.currentHour;
                if (noRepeat) return;
                timer = $timeout(function() {
                    $scope.hourChangeDown(timeout);
                }, timeout);
            };

            $scope.minuteChangeUp = function(timeout) {
                if (!timeout) iniWindowHandler();
                $scope.values.currentMinute++;
                timeout = Math.max(70, (timeout || 900) / 2);
                if ($scope.values.currentMinute >= 60) {
                    $scope.hourChangeUp(false, true);
                }
                $scope.values.currentMinute = $scope.values.currentMinute > 59 ? 0 : $scope.values.currentMinute;
                timer = $timeout(function() {
                    $scope.minuteChangeUp(timeout);
                }, timeout);
            };

            $scope.minuteChangeDown = function(timeout) {
                if (!timeout) iniWindowHandler();
                $scope.values.currentMinute--;
                if ($scope.values.currentMinute < 0) {
                    $scope.hourChangeDown(false, true);
                }
                timeout = Math.max(70, (timeout || 900) / 2);
                $scope.values.currentMinute = $scope.values.currentMinute < 0 ? 59 : $scope.values.currentMinute;
                timer = $timeout(function() {
                    $scope.minuteChangeDown(timeout);
                }, timeout);
            };

            $scope.hourChange = function(e) {
                if ((e.which == 38) || (e.which == 40)) {
                    e.preventDefault();
                }
                if (angular.element(e.target).data('is-downed')) {
                    return;
                }
                angular.element(e.target).data('is-downed', true);
                switch (e.which) {
                    case 38:
                        $scope.hourChangeUp();
                        break;
                    case 40:
                        $scope.hourChangeDown();
                        break;
                }
            };

            $scope.minuteChange = function(e) {
                if ((e.which == 38) || (e.which == 40)) {
                    e.preventDefault();
                }
                if (angular.element(e.target).data('is-downed')) {
                    return;
                }
                angular.element(e.target).data('is-downed', true);
                switch (e.which) {
                    case 38:
                        $scope.minuteChangeUp();
                        break;
                    case 40:
                        $scope.minuteChangeDown();
                        break;
                }
            };


            $scope.keyUp = function(e) {
                angular.element(e.target).data('is-downed', false);
                timer ? $timeout.cancel(timer) : false;
                setValue();
            };

            $scope.$on('$destroy', function() {
                angular.element($window).off('mouseup', upFunc);
            });

        }
    }
});
