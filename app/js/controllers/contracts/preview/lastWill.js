angular.module('app').controller('lastWillPreviewController', function($timeout, $rootScope, contractService, openedContract, $scope, exRate, $state) {
    $scope.contract = openedContract.data;

    $scope.setContract($scope.contract);
    var contractDetails = $scope.contract.contract_details;

    var durationList = [
        {
            value: 365,
            name: 'years'
        }, {
            value: 30,
            name: 'months'
        }, {
            value: 1,
            name: 'days'
        }
    ];
    var checkInterval = durationList.filter(function(check) {
        return !(contractDetails.check_interval % (check.value * 24 * 3600));
    })[0];

    contractDetails.check_interval = {
        period: contractDetails.check_interval / (checkInterval.value * 24 * 3600),
        periodUnit: checkInterval.name
    };

});