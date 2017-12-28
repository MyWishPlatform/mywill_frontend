angular.module('Directives').directive('ngRanger', function($rootScope) {
    var win = angular.element(window);

    return {
        'restrict': 'A',
        'replace': true,
        'scope': {
            ngRanger: '='
        },
        templateUrl: $rootScope.getTemplate('directives/ngRanger'),
        'controller': function ($scope) {

        },
        'link': function ($scope, element) {

            var movePoint = angular.element('.ng-ranger-line-point:first', element);

            var changePercentage = function() {
                $scope.percentage = Math.min(100, Math.max(0, $scope.percentage));
                $scope.value = Math.round($scope.percentage);
                $scope.ngRanger.model.percentage = $scope.value;
                $scope.ngRanger.onChange ? $scope.ngRanger.onChange() : true;
            };
            var onMoveWindow = function(event) {
                event.preventDefault();
                var positionX = event.screenX || event.touches[0].screenX;
                $scope.percentage+= (positionX - startPosition) / onePercentWidth;
                startPosition = positionX;
                changePercentage();
                $scope.$apply();
                return false;
            };
            var onUpWindow = function(event) {
                event.preventDefault();
                $scope.changeProgress = false;
                $scope.$apply();
                win.off('mouseup touchend', onUpWindow);
                win.off('mousemove touchmove', onMoveWindow);
                return false;
            };

            var startPosition, widthElement, onePercentWidth;
            var onDownPoint = function(event) {
                event.preventDefault();
                if (event.touches && event.touches.length > 1) return;
                widthElement = element.width();
                onePercentWidth = widthElement / 100;
                startPosition = event.pageX || event.touches[0].screenX;
                $scope.changeProgress = true;
                $scope.$apply();
                win.on('mouseup touchend', onUpWindow);
                win.on('mousemove touchmove', onMoveWindow);
                return false;
            };

            movePoint.on('mousedown touchstart', onDownPoint);


            $scope.$watch('ngRanger.model.percentage', function() {
                $scope.percentage = $scope.ngRanger.model.percentage || 0;
                $scope.value = Math.round($scope.percentage);
                changePercentage();
            });
        }
    }
});