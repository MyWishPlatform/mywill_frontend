angular.module('app').controller('eosITokenPreviewController', function($timeout, $rootScope, contractService, openedContract, $scope, $filter, EOSService) {
    $scope.contract = openedContract.data;

    $scope.iniContract($scope.contract);
    var contractDetails = $scope.contract.contract_details;

    contractDetails.maximum_supply = new BigNumber(contractDetails.maximum_supply).div(Math.pow(10, contractDetails.decimals)).toString(10);


    $scope.totalSupply = {
        tokens: 0
    };

    $scope.chartOptions = {
        itemValue: 'amount',
        itemLabel: 'address'
    };

    switch ($scope.contract.network) {
        case 10:
        case 11:
            $scope.blockchain = 'EOS';
            $scope.contractInfo = 'eos_contract_token';
            break;
    }

    $scope.chartData = [
        {
            amount: '',
            address: $filter('translate')('POPUP_FORMS.MINT_TOKENS_FORM.CHART.EOS_DISTRIBUTED_BEFORE')
        }, {
            amount: '',
            address: $filter('translate')('POPUP_FORMS.MINT_TOKENS_FORM.CHART.EOS_DISTRIBUTE_AVAILABLE')
        }
    ];
    $scope.tokenInfo = {};

    var symbol = $scope.contract.contract_details.token_short_name;
    EOSService.coinInfo(symbol, $scope.contract.network).then(function(result) {
        var totalSupply = result[symbol].supply.split(' ')[0];
        $scope.chartData[0].amount = totalSupply;

        var maximumSupply = result[symbol].max_supply.split(' ')[0];
        $scope.chartData[1].amount = new BigNumber(maximumSupply).minus(totalSupply).toString(10);
        $scope.tokenInfo['totalSupply'] = totalSupply;
        $scope.tokenInfo['maximumSupply'] = maximumSupply;
    });

});
