var module = angular.module('Directives');
module.directive('ngBarChart', function($rootScope) {
    var colors = ['#206EFF', '#024EA1', '#FFD902', '#EE7023', 'rgb(29, 161, 2)', 'rgb(161, 2, 158)'];
    return {
        restrict: 'A',
        replace: true,
        templateUrl: $rootScope.getTemplate('directives/ngBarChart'),
        scope: {
            ngBarChart: '='
        },
        link: function ($scope, element) {

            var checkChartData = function() {
                var data = $scope.ngBarChart.data;
                $scope.amountBonusChartData = [];
                if (!(data && data.length)) return;

                var firstElement = data[0];
                var lastElement = data[data.length - 1];
                var valuesRange = new BigNumber(lastElement.maxValueX).minus(firstElement.minValueX);
                var onePercent  = valuesRange.div(100);

                var onePercentForPixel = new BigNumber(element.width()).div(100);

                $scope.originalSvgHeight = 400;
                $scope.svgHeight = $scope.originalSvgHeight * (element.width() / 1000);
                element.height($scope.svgHeight);

                data.map(function(dataItem) {
                    var leftOffset = new BigNumber(dataItem.minValueX).minus(firstElement.minValueX).div(onePercent).times(onePercentForPixel);

                    var redColor = 225 - Math.round(4.5 * Math.max(0, dataItem.valueY - 50));
                    var greenColor = 225 - Math.round(4.5 * Math.max(0, 50 - dataItem.valueY));


                    var blueColor = 0;

                    var currentChartItem = {
                        width: new BigNumber(dataItem.maxValueX).minus(dataItem.minValueX).div(onePercent).times(onePercentForPixel).plus(leftOffset).round(2).toString(10),
                        left: leftOffset.plus(1).round(2).toString(10),
                        height: $scope.svgHeight * (dataItem.valueY / 100),
                        color: [redColor, greenColor, blueColor]
                    };
                    $scope.amountBonusChartData.push(currentChartItem);
                });
            };

            $scope.$watch('ngBarChart.data', function(data) {
                checkChartData();
            });

        }
    }
});