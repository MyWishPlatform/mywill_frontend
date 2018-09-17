angular.module('app').controller('eosWalletPreviewController', function($timeout, openedContract, $scope, EOSService) {
    $scope.contract = openedContract.data;
    $scope.iniContract($scope.contract);
    $scope.EOSprices = {};
    EOSService.getTableRows('eosio', 'rammarket', 'eosio', $scope.contract.network).then(function(response) {
        var ramPrice = response.rows[0]['quote']['balance'].split(" ")[0] / response.rows[0]['base']['balance'].split(" ")[0] * 1024;
        EOSService.checkAddress('eosio', $scope.network).then(function(response) {
            $scope.EOSprices = {
                NET: response.net_limit.max / 1024 / (response.net_weight / 10000),
                CPU: response.cpu_limit.max / 1000 / (response.cpu_weight / 10000),
                RAM: ramPrice
            };
        });
    });
});
