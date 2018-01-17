var module = angular.module('Directives');
module.directive('ngTimesBonusChart', function($rootScope) {

    return {
        restrict: 'A',
        replace: true,
        templateUrl: $rootScope.getTemplate('directives/ngTimesBonusChart'),
        scope: {
            ngTimesBonusChart: '='
        },
        link: function ($scope, element) {
            $scope.originalSvgHeight = 320;
            $scope.originalSvgWidth = 1240;

            var checkChartData = function() {
                $scope.timesBonusChartData = [];
                var svg = element.find('svg');
                $scope.svgHeight = $scope.originalSvgHeight * (svg.width() / 1000);
                $scope.leftOffset = 30;
                $scope.bottomOffset = 20;

                svg.height($scope.svgHeight);
                var onePercentOfWidth = (svg.width() - $scope.leftOffset) / 100;
                var onePercentOfHeight = (svg.height() - $scope.bottomOffset) / 100;

                var chartData = $scope.ngTimesBonusChart.data;
                var lastChartDataItem = chartData[chartData.length - 1];

                var minAmountValue = chartData[0]['min_amount'];
                var maxAmountValue = lastChartDataItem['max_amount'];
                var amountLength = new BigNumber(maxAmountValue).minus(minAmountValue);
                var amountOnePercentLength = new BigNumber(onePercentOfHeight + '').div(amountLength.div('100'));

                var minDateValue = chartData[0]['min_time'];
                var maxDateValue = lastChartDataItem['max_time'];
                var datesLength = maxDateValue - minDateValue;
                var dateTimeOnePercentLength = onePercentOfWidth / datesLength * 100;

                $scope.ngTimesBonusChart.data.map(function(item, index) {
                    var redColor = 225 - Math.round(4.5 * Math.max(0, item.bonus - 50));
                    var greenColor = 225 - Math.round(4.5 * Math.max(0, 50 - item.bonus));
                    var blueColor = 0;

                    var bottomAmountPosition = (svg.height() - $scope.bottomOffset) - new BigNumber(item['min_amount']).minus(minAmountValue).times(amountOnePercentLength).toString(10) * 1;
                    var topAmountPosition = (svg.height() - $scope.bottomOffset) - new BigNumber(item['max_amount']).minus(minAmountValue).times(amountOnePercentLength).toString(10) * 1;
                    var leftDatePosition = (item['min_time'] - minDateValue) * dateTimeOnePercentLength;
                    var rightDatePosition = (item['max_time'] - minDateValue) * dateTimeOnePercentLength;

                    $scope.timesBonusChartData.push({
                        point: $scope.leftOffset + ',' + topAmountPosition + ' ' + (rightDatePosition + $scope.leftOffset) + ',' + topAmountPosition + ' ' + (rightDatePosition + $scope.leftOffset) + ', ' + ($scope.svgHeight - $scope.bottomOffset) + ' ' + (leftDatePosition + $scope.leftOffset) + ', ' + ($scope.svgHeight - $scope.bottomOffset) + ' ' + (leftDatePosition + $scope.leftOffset) + ', ' + bottomAmountPosition + ' ' + $scope.leftOffset + ', ' + bottomAmountPosition,
                        color: redColor+','+greenColor+','+blueColor
                    });

                });
            };

            $scope.$watch('ngTimesBonusChart.data', function(data) {
                if (!data) return;
                checkChartData();
            });
        }
    }
});