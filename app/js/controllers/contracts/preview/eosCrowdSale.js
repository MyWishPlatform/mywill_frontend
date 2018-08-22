angular.module('app').controller('eosCrowdSalePreviewController', function($timeout, $rootScope, contractService, web3Service,
                                                                        openedContract, $scope, $filter) {
    $scope.contract = openedContract.data;


    $scope.setContract($scope.contract);

    var contractDetails = $scope.contract.contract_details;

    $scope.contractCrowdsaleInfo = 'eos_contract_crowdsale';
    $scope.contractTokenInfo = 'eos_contract_token';



    $scope.currencyPow = 4;

    if (contractDetails.eth_contract_crowdsale && contractDetails.eth_contract_crowdsale.address) {
        web3Service.setProvider('infura');
        var contract = web3Service.createContractFromAbi(contractDetails.eth_contract_crowdsale.address, contractDetails.eth_contract_crowdsale.abi);
        if (typeof contract.methods.vault === 'function') {
            contract.methods.vault().call(function(error, result) {
                if (error) return;
                contractDetails.eth_contract_crowdsale.vault = result;
                $scope.$apply();
            });
        }
        if (contractDetails.whitelist) {
            contractService.getWhiteList($scope.contract.id, {limit: 1}).then(function(response) {
                $scope.whiteListedAddresses = response.data;
            });
        }
    }
    contractDetails.hard_cap_eth = new BigNumber(contractDetails.hard_cap).div(Math.pow(10,$scope.currencyPow)).round(Math.min(2, contractDetails.decimals)).toString(10);
    contractDetails.soft_cap_eth = new BigNumber(contractDetails.soft_cap).div(Math.pow(10,$scope.currencyPow)).round(Math.min(2, contractDetails.decimals)).toString(10);

    contractDetails.hard_cap = new BigNumber(contractDetails.hard_cap).times(contractDetails.rate).div(Math.pow(10,$scope.currencyPow)).toString(10);
    contractDetails.soft_cap = new BigNumber(contractDetails.soft_cap).times(contractDetails.rate).div(Math.pow(10,$scope.currencyPow)).toString(10);

    contractDetails.min_wei = contractDetails.min_wei !== null ? new BigNumber(contractDetails.min_wei).div(Math.pow(10,$scope.currencyPow)).toString(10) : undefined;
    contractDetails.max_wei = contractDetails.max_wei !== null ? new BigNumber(contractDetails.max_wei).div(Math.pow(10,$scope.currencyPow)).toString(10) : undefined;


    var powerNumber = new BigNumber('10').toPower(contractDetails.decimals || 0);
    contractDetails.token_holders.map(function(holder) {
        holder.amount = new BigNumber(holder.amount).div(powerNumber).toString(10);
    });

    var holdersSum = contractDetails.token_holders.reduce(function (val, item) {
        var value = new BigNumber(item.amount || 0);
        return value.plus(val);
    }, new BigNumber(0));

    var ethSum = holdersSum.plus(contractDetails.hard_cap);
    $scope.totalSupply = {
        eth: ethSum.div(contractDetails.rate).round(2).toString(10),
        tokens: ethSum.round(2).toString(10)
    };


    $scope.chartOptions = {
        itemValue: 'amount',
        itemLabel: 'address'
    };
    $scope.chartData = angular.copy(contractDetails.token_holders);
    $scope.chartData.unshift({
        amount: contractDetails.hard_cap,
        address: $filter('translate')('CONTRACTS.FOR_SALE')
    });

});






