angular.module('app').controller('eosTokenPreviewController', function($timeout, $rootScope, contractService, openedContract, $scope, $filter, EOSService) {
    $scope.contract = openedContract.data;

    $scope.iniContract($scope.contract);
    var contractDetails = $scope.contract.contract_details;

    var powerNumber = new BigNumber('10').exponentiatedBy(contractDetails.decimals || 0);
    contractDetails.token_holders.map(function(holder) {
        holder.amount = new BigNumber(holder.amount).div(powerNumber).toString(10);
    });


    contractDetails.maximum_supply = new BigNumber(contractDetails.maximum_supply).div(Math.pow(10, contractDetails.decimals)).toString(10);

    var holdersSum = contractDetails.token_holders.reduce(function (val, item) {
        var value = new BigNumber(item.amount || 0);
        return value.plus(val);
    }, new BigNumber(0));


    $scope.totalSupply = {
        tokens: holdersSum
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

}).controller('eosTokenMintController', function(EOSService, $scope, $timeout, $filter) {

    var fullContract = $scope.ngPopUp.params.contract;
    var contract = fullContract.contract_details;

    $scope.recipient = {
        amount: '',
        address: ''
    };

    EOSService.coinInfo(
        contract.token_short_name,
        fullContract.network,
        (fullContract.contract_type == 14) ? contract.token_account : contract.eos_contract.address
    ).then(function(result) {
        result[contract.token_short_name] = result[contract.token_short_name] || {
            supply: '0',
            max_supply: '0'
        };
        $timeout(function() {
            $scope.tokenInfo['totalSupply'] = result[contract.token_short_name].supply.split(' ')[0] || 0;
            $scope.tokenInfo['maximumSupply'] = result[contract.token_short_name].max_supply.split(' ')[0] || 0;
            $scope.tokenInfo['totalSupply'] = new BigNumber($scope.tokenInfo['totalSupply']).toString(10);
            $scope.tokenInfo['maximumSupply'] = new BigNumber($scope.tokenInfo['maximumSupply']).toString(10);
            $scope.$apply();
            $scope.$parent.$broadcast('changeContent');
            beforeDistributed.amount = $scope.tokenInfo['totalSupply'];
            $scope.totalSupply = $scope.tokenInfo['totalSupply'];
            if ($scope.tokenInfo['totalSupply'] == 0) {
                beforeDistributed.address = '';
            } else {
                beforeDistributed.address = $filter('translate')('POPUP_FORMS.MINT_TOKENS_FORM.CHART.EOS_DISTRIBUTED_BEFORE');
            }
            $scope.checkTokensAmount();
        });
    });

    $scope.tokenInfo = {};

    $scope.scatterNotInstalled = false;
    $scope.closeScatterAlert = function() {
        $scope.scatterNotInstalled = false;
        $scope.accountNotFinded = false;
        $scope.mintServerError = false;
    };

    $scope.mintTokens = function() {
        $scope.scatterNotInstalled = !EOSService.checkScatter();

        if ($scope.scatterNotInstalled) return;

        $scope.mintInProgress = true;

        EOSService.mintTokens(
            contract.admin_address,
            $scope.recipient.address,
            contract.token_short_name,
            new BigNumber($scope.recipient.amount).toFormat(contract.decimals).toString(10).replace(/,/g, ''),
            '',
            (fullContract.contract_type == 14) ? contract.token_account : contract.eos_contract.address,
            fullContract.network
        ).then(function(result) {
            $scope.mintInProgress = false;
            $scope.successTransaction = result;
        }, function(error) {
            // alert(JSON.stringify(error));
            $scope.mintInProgress = false;
            switch(error.code) {
                case 1:
                    $scope.accountNotFinded = true;
                    break;
                case 2:
                    $scope.mintServerError = true;
                    break;
            }
        });
    };

    var beforeDistributed = {
        amount: 0,
        address: ''
    };

    var totalSupply = {
        tokens: 0
    };

    var chartData = [beforeDistributed];
    $scope.chartData = [];

    $scope.chartOptions = {
        itemValue: 'amount',
        itemLabel: 'address'
    };

    $scope.checkTokensAmount = function() {
        if (!$scope.mintForm) return;
        $scope.chartData = angular.copy(chartData);
        $scope.maximumMint = new BigNumber($scope.tokenInfo['maximumSupply']).minus($scope.tokenInfo['totalSupply']);
        $scope.chartData.push({
            amount: $scope.maximumMint.minus($scope.recipient.amount || 0).toString(10),
            address:  $filter('translate')('POPUP_FORMS.MINT_TOKENS_FORM.CHART.EOS_DISTRIBUTE_AVAILABLE')
        });

        if ($scope.mintForm.$valid) {
            $scope.chartData.push($scope.recipient);
            $scope.totalSupply = new BigNumber(beforeDistributed.amount).plus($scope.recipient.amount);
        }
    };

    $scope.dataChanged = function() {
        $scope.chartOptions.updater ? $scope.chartOptions.updater() : false;
    };

    $scope.closeMintingForm = function() {
        $scope.$parent.$broadcast('$closePopUps');
    };

});
