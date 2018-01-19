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
            $scope.originalSvgHeight = 480;
            $scope.originalSvgWidth = 640;
            $scope.svgHeight = 0;
            var checkChartData = function() {
                if (!$scope.ngTimesBonusChart.data.length) return;
                $scope.timesBonusChartData = [];
                var svg = element.find('svg');
                $scope.svgWidth = svg.width();
                $scope.svgHeight = $scope.originalSvgHeight * ($scope.svgWidth / $scope.originalSvgWidth);
                $scope.leftOffset = 30;
                $scope.bottomOffset = 20;
                $scope.maxPosition = 25;


                svg.height($scope.svgHeight);
                var onePercentOfWidth = ($scope.svgWidth - $scope.leftOffset) / 100;
                var onePercentOfHeight = ($scope.svgHeight - $scope.bottomOffset) / 100;

                var chartData = $scope.ngTimesBonusChart.data;

                var firstAmountsBonus = chartData.filter(function(bonus) {
                    return bonus.min_amount;
                })[0];
                var lastAmountsBonuses = chartData.filter(function(bonus) {
                    return bonus.max_amount;
                });

                var lastAmountsBonus = lastAmountsBonuses[lastAmountsBonuses.length - 1];
                var minAmountBonus = firstAmountsBonus ? firstAmountsBonus.min_amount : $scope.ngTimesBonusChart.params.min_amount;
                var maxAmountBonus = new BigNumber(lastAmountsBonus ? lastAmountsBonus.max_amount : $scope.ngTimesBonusChart.params.min_amount);
                var rangeAmounts = new BigNumber(maxAmountBonus).minus(minAmountBonus).div('100').times($scope.maxPosition / onePercentOfHeight + '');

                var firstDateBonus = chartData.filter(function(bonus) {
                    return bonus.min_time;
                })[0];
                var lastDateBonuses = chartData.filter(function(bonus) {
                    return bonus.max_time;
                });
                var lastDateBonus = lastDateBonuses[lastDateBonuses.length - 1];

                var minDateBonus = firstDateBonus ? firstDateBonus.min_time : $scope.ngTimesBonusChart.params.min_time;
                var maxDateBonus = lastDateBonus ? lastDateBonus.max_time : $scope.ngTimesBonusChart.params.min_time;


                var rangeDates = (maxDateBonus - minDateBonus) / 100 * ($scope.maxPosition / onePercentOfWidth);

                if (maxDateBonus < $scope.ngTimesBonusChart.params.max_time) {
                    maxDateBonus = maxDateBonus + rangeDates;
                }

                if (new BigNumber($scope.ngTimesBonusChart.params.max_amount).minus(maxAmountBonus) > 0) {
                    maxAmountBonus = new BigNumber(maxAmountBonus).plus(rangeAmounts);
                }

                var amountLength = maxAmountBonus.minus(minAmountBonus);
                var amountOnePercentLength = new BigNumber(onePercentOfHeight).div(amountLength.div('100'));

                var datesLength = maxDateBonus - minDateBonus;
                var dateTimeOnePercentLength = onePercentOfWidth / datesLength * 100;

                chartData.map(function(bonus) {
                    bonus.min_amount = bonus.min_amount || minAmountBonus;
                    bonus.max_amount = bonus.max_amount || maxAmountBonus.toString(10);
                    bonus.prev_min_amount = bonus.prev_min_amount || minAmountBonus;
                    bonus.min_time = bonus.min_time || (firstDateBonus ? firstDateBonus.min_time : 0);
                    bonus.max_time = bonus.max_time || maxDateBonus;
                    bonus.prev_min_time = bonus.prev_min_time || minDateBonus;
                });

                $scope.ngTimesBonusChart.data.map(function(item, index) {
                    var redColor = 225 - Math.round(4.5 * Math.max(0, item.bonus - 50));
                    var greenColor = 225 - Math.round(4.5 * Math.max(0, 50 - item.bonus));
                    var blueColor = 0;

                    var bottomAmountPosition =
                        new BigNumber(item['min_amount']).minus(minAmountBonus).times(amountOnePercentLength).toString(10) * 1;
                    var prevBottomAmountPosition =
                        new BigNumber(item['prev_min_amount']).minus(minAmountBonus).times(amountOnePercentLength).toString(10) * 1;
                    var topAmountPosition =
                        new BigNumber(item['max_amount']).minus(minAmountBonus).times(amountOnePercentLength).toString(10) * 1;

                    var leftDatePosition =
                        (item['min_time'] - minDateBonus) * dateTimeOnePercentLength;
                    var prevLeftDatePosition =
                        (item['prev_min_time'] - minDateBonus) * dateTimeOnePercentLength;
                    var rightDatePosition =
                        (item['max_time'] - minDateBonus) * dateTimeOnePercentLength;

                    var yCorrector = $scope.svgHeight - $scope.bottomOffset;
                    var pointX1 = prevLeftDatePosition + $scope.leftOffset;
                    var pointX2 = leftDatePosition + $scope.leftOffset;
                    var pointX3 = rightDatePosition + $scope.leftOffset;
                    var pointY1 = yCorrector - prevBottomAmountPosition;
                    var pointY2 = yCorrector - bottomAmountPosition;
                    var pointY3 = yCorrector - topAmountPosition;

                    var points = [
                        pointX1 + ',' + pointY3,
                        pointX3 + ',' + pointY3,
                        pointX3 + ',' + pointY1,
                        pointX2 + ',' + pointY1,
                        pointX2 + ', ' + pointY2,
                        pointX1 + ', ' + pointY2
                    ];

                    $scope.timesBonusChartData.push({
                        point:  points.join(' '),
                        color: redColor+','+greenColor+','+blueColor,
                        bonus: item.bonus / 100
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