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
                var chartData = $scope.ngTimesBonusChart.data;
                var lastChartDataItem = chartData[chartData.length - 1];

                var minAmountValue = chartData[0]['amount_from'];
                var maxAmountValue = lastChartDataItem['amount_to'];
                var amountLength = new BigNumber(maxAmountValue).minus(minAmountValue);
                var amountOnePercentLength = new BigNumber(onePercentOfWidth + '').div(amountLength.div('100'));

                var minDateValue = chartData[0]['check_from'];
                var maxDateValue = lastChartDataItem['check_to'];

                var datesLength = maxDateValue - minDateValue;
                var dateTimeOnePercentLength = onePercentOfWidth / (datesLength / 100);

                $scope.ngTimesBonusChart.data.map(function(item) {
                    var redColor = 225 - Math.round(4.5 * Math.max(0, item.bonus - 50));
                    var greenColor = 225 - Math.round(4.5 * Math.max(0, 50 - item.bonus));
                    var blueColor = 0;

                    var leftAmountPosition = new BigNumber(item['amount_from']).minus(minAmountValue).times(amountOnePercentLength + '');
                    var rightAmountPosition = new BigNumber(item['amount_to']).minus(minAmountValue).times(amountOnePercentLength + '');
                    var leftDatePosition = datesLength ? (item['check_from'] - minDateValue) * dateTimeOnePercentLength : element.width();
                    var rightDatePosition = datesLength ? (item['check_to'] - minDateValue) * dateTimeOnePercentLength : element.width();

                    $scope.timesBonusChartData.push({
                        color: [redColor, greenColor, blueColor],
                        amount_left: leftAmountPosition,
                        amount_right: rightAmountPosition,
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