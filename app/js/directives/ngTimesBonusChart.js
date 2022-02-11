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
                $scope.svgHeight = Math.toFixed($scope.originalSvgHeight * ($scope.svgWidth / $scope.originalSvgWidth));
                $scope.leftOffset = 30;
                $scope.bottomOffset = 20;
                $scope.maxPosition = 25;


                svg.height($scope.svgHeight);
                var onePercentOfWidth = new BigNumber($scope.svgWidth).minus($scope.leftOffset).div(100).toFixed(5);
                var onePercentOfHeight = new BigNumber($scope.svgHeight).minus($scope.bottomOffset).div(100).toFixed(5);

                var chartData = $scope.ngTimesBonusChart.data;

                var firstAmountsBonus = chartData.filter(function(bonus) {
                    return bonus.min_amount;
                })[0];
                var lastAmountsBonuses = chartData.filter(function(bonus) {
                    return bonus.max_amount;
                });

                var lastAmountsBonus = lastAmountsBonuses[lastAmountsBonuses.length - 1];
                var minAmountBonus = new BigNumber(firstAmountsBonus ? firstAmountsBonus.min_amount : $scope.ngTimesBonusChart.params.min_amount);
                var maxAmountBonus = new BigNumber(lastAmountsBonus ? lastAmountsBonus.max_amount : $scope.ngTimesBonusChart.params.max_amount);
                var rangeAmounts = new BigNumber(maxAmountBonus).minus(minAmountBonus).div('100').times($scope.maxPosition / onePercentOfHeight + '');

                var firstDateBonus = chartData.filter(function(bonus) {
                    return bonus.min_time;
                })[0];
                var lastDateBonuses = chartData.filter(function(bonus) {
                    return bonus.max_time;
                });
                var lastDateBonus = lastDateBonuses[lastDateBonuses.length - 1];

                var minDateBonus = firstDateBonus ? firstDateBonus.min_time : $scope.ngTimesBonusChart.params.min_time;
                var maxDateBonus = lastDateBonus ? lastDateBonus.max_time : $scope.ngTimesBonusChart.params.max_time;

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

                var maxBonus, minBonus;
                chartData.map(function(item) {
                    maxBonus = (maxBonus && (maxBonus > item.bonus)) ? maxBonus : item.bonus;
                    minBonus = (minBonus && (minBonus < item.bonus)) ? minBonus : item.bonus;
                });

                var onlyDateMaxBonus, onlyTokenMaxBonus;

                chartData.filter(function(item) {
                    return !item.min_amount;
                }).map(function(item) {
                    onlyDateMaxBonus = (onlyDateMaxBonus && (onlyDateMaxBonus > item.bonus)) ? onlyDateMaxBonus : item.bonus;
                });

                chartData.filter(function(item) {
                    return !item.min_time;
                }).map(function(item) {
                    onlyTokenMaxBonus = (onlyTokenMaxBonus && (onlyTokenMaxBonus > item.bonus)) ? onlyTokenMaxBonus : item.bonus;
                });
                if (onlyDateMaxBonus && onlyTokenMaxBonus) {
                    maxBonus = onlyDateMaxBonus + onlyTokenMaxBonus;
                }


                $scope.bonusesParams = {
                    min: minBonus,
                    max: maxBonus,
                    rangeBonuses: maxBonus - minBonus,
                    minOpacity: 0.3,
                    maxOpacity: 1
                };



                chartData.map(function(item, index) {

                    item.min_amount = item.min_amount || minAmountBonus.toString(10);
                    item.max_amount = item.max_amount || maxAmountBonus.toString(10);
                    item.prev_min_amount = item.prev_min_amount || minAmountBonus.toString(10);
                    item.min_time = item.min_time || minDateBonus;
                    item.max_time = item.max_time || maxDateBonus;
                    item.prev_min_time = item.prev_min_time || minDateBonus;


                    var bottomAmountPosition =
                        new BigNumber(item['min_amount']).minus(minAmountBonus).times(amountOnePercentLength).toFixed(3).toString(10) * 1;
                    // var prevBottomAmountPosition =
                    //     new BigNumber(item['prev_min_amount']).minus(minAmountBonus).times(amountOnePercentLength).toFixed(3).toString(10) * 1;
                    var topAmountPosition =
                        new BigNumber(item['max_amount']).minus(minAmountBonus).times(amountOnePercentLength).toFixed(3).toString(10) * 1;
                    var leftDatePosition =
                        Math.toFixed((item['min_time'] - minDateBonus) * dateTimeOnePercentLength);
                    // var prevLeftDatePosition =
                    //     Math.toFixed((item['prev_min_time'] - minDateBonus) * dateTimeOnePercentLength);
                    var rightDatePosition =
                        Math.toFixed((item['max_time'] - minDateBonus) * dateTimeOnePercentLength);
                    var yCorrector = $scope.svgHeight - $scope.bottomOffset;
                    var pointX1 = leftDatePosition + $scope.leftOffset;
                    var pointX2 = rightDatePosition + $scope.leftOffset;
                    var pointY1 = yCorrector - bottomAmountPosition;
                    var pointY2 = yCorrector - topAmountPosition;
                    var points = [
                        pointX1 + ',' + pointY1,
                        pointX2 + ',' + pointY1,
                        pointX2 + ',' + pointY2,
                        pointX1 + ',' + pointY2
                    ];

                    var opacity = $scope.bonusesParams.rangeBonuses ?
                        $scope.bonusesParams.minOpacity + (item.bonus - $scope.bonusesParams.min) / $scope.bonusesParams.rangeBonuses * 0.7 : 1;

                    $scope.timesBonusChartData.push({
                        point:  points.join(' '),
                        bonus: item.bonus / 100,
                        opacity: Math.toFixed(opacity * 1000) / 1000
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
