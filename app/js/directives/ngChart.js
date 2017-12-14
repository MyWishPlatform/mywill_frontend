var module = angular.module('Directives');
module.directive('ngChart', function($timeout) {
    var colors = ['#206EFF', '#024EA1', '#FFD902', '#EE7023', 'rgb(29, 161, 2)', 'rgb(161, 2, 158)'];
    return {
        restrict: 'A',
        replace: true,
        scope: {
            ngChart: '=',
            ngChartData: '=',
            ngChartOptions: '='
        },
        link: function ($scope, element) {
            var amChartOptions = {
                "type": "pie",
                "theme": "light",
                "colors": colors,
                "titleField": "title",
                "valueField": "value",
                "labelRadius": 5,
                "marginBottom": 25,
                "marginTop": 25,
                "radius": "38%",
                "innerRadius": "60%",
                "labelText": "[[title]]"
            };


            var chart = AmCharts.makeChart(element.get(0), amChartOptions);

            $scope.ngChartOptions.updater = function() {
                $timeout(function() {
                    var newData = [];
                    $scope.ngChartData.map(function(newDataItem) {
                        newData.push({
                            title: newDataItem[$scope.ngChartOptions.itemLabel],
                            value: newDataItem[$scope.ngChartOptions.itemValue]
                        });
                    });
                    chart.dataProvider = newData;
                    chart.validateData();
                });
            };

        }
    }
});