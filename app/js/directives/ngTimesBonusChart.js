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

                $scope.svgHeight = $scope.originalSvgHeight * (element.width() / 1000);
                element.height($scope.svgHeight);
                var onePercentOfWidth = element.width() / 100;
                var onePercentOfHeight = element.height() / 100;

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

                    var bottomAmountPosition = element.height() - new BigNumber(item['min_amount']).minus(minAmountValue).times(amountOnePercentLength).toString(10) * 1;
                    var topAmountPosition = element.height() - new BigNumber(item['max_amount']).minus(minAmountValue).times(amountOnePercentLength).toString(10) * 1;
                    var leftDatePosition = (item['min_time'] - minDateValue) * dateTimeOnePercentLength;
                    var rightDatePosition = (item['max_time'] - minDateValue) * dateTimeOnePercentLength;

                    $scope.timesBonusChartData.push({
                        color: [redColor, greenColor, blueColor],
                        amount_bottom: bottomAmountPosition,
                        amount_top: topAmountPosition,
                        date_left: leftDatePosition,
                        date_right: rightDatePosition
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