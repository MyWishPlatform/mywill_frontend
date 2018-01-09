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

                var leftOffset = new BigNumber('0');
                data.map(function(dataItem) {
                    var currentChartItem = {
                        width: new BigNumber(dataItem.maxValueX).minus(dataItem.minValueX).div(onePercent).times(onePercentForPixel).plus(leftOffset).round(2).toString(10),
                        left: leftOffset.round(2).toString(10),
                        height: 200 * (dataItem.valueY / 100),
                        color: [
                            127 + Math.round(128 * (100 - dataItem.valueY) / 100) - Math.round(128 * dataItem.valueY / 100), 127 + Math.round(128 * dataItem.valueY / 100) - Math.round(128 * (100 - dataItem.valueY) / 100),
                            255 - Math.max(Math.round(127 * (100 - dataItem.valueY) / 100), Math.round(127 * dataItem.valueY / 100))
                        ]
                    };
                    $scope.amountBonusChartData.push(currentChartItem);
                    leftOffset = new BigNumber(currentChartItem.width);
                });
            };

            $scope.$watch('ngBarChart.data', function(data) {
                checkChartData();
            });

        }
    }
});