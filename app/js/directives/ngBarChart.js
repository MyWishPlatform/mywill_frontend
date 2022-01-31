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

            var svgElement = element.find('svg:first');
            var checkChartData = function() {
                var data = $scope.ngBarChart.data;
                $scope.amountBonusChartData = [];
                if (!(data && data.length)) return;

                var firstElement = data[0];
                var lastElement = data[data.length - 1];
                var valuesRange = new BigNumber(lastElement.maxValueX).minus(firstElement.minValueX);
                var onePercent  = valuesRange.div(100);

                var onePercentForPixel = new BigNumber(svgElement.width()).div(100);

                $scope.originalSvgHeight = 400;
                $scope.svgHeight = $scope.originalSvgHeight * (svgElement.width() / 1000);
                svgElement.height($scope.svgHeight);


                var maxBonus, minBonus;
                data.map(function(item) {
                    maxBonus = (maxBonus && (maxBonus > item.valueY)) ? maxBonus : item.valueY;
                    minBonus = (minBonus && (minBonus < item.valueY)) ? minBonus : item.valueY;
                });

                if (minBonus == maxBonus) {
                    minBonus = 0;
                }
                $scope.bonusesParams = {
                    min: minBonus,
                    max: maxBonus,
                    rangeBonuses: maxBonus - minBonus,
                    minOpacity: 0.3,
                    maxOpacity: 1
                };

                data.map(function(dataItem) {
                    var leftOffset = new BigNumber(dataItem.minValueX).minus(firstElement.minValueX).div(onePercent).times(onePercentForPixel);
                    var percentOfValue = Math.round(($scope.bonusesParams.minOpacity + (dataItem.valueY - $scope.bonusesParams.min) / $scope.bonusesParams.rangeBonuses * 0.7) * 1000) / 1000;

                    var currentChartItem = {
                        width: new BigNumber(dataItem.maxValueX).minus(dataItem.minValueX).div(onePercent).times(onePercentForPixel).plus(leftOffset).decimalPlaces(2).toString(10),
                        left: leftOffset.round(2).toString(10),
                        height: $scope.svgHeight * percentOfValue,
                        bonus: dataItem.valueY / 100,
                        opacity: percentOfValue
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
