angular.module('app').controller('tokenPreviewController', function($timeout, $rootScope, contractService, openedContract, $scope, exRate, $state) {
    $scope.contract = openedContract.data;

    $scope.setContract($scope.contract);
    var contractDetails = $scope.contract.contract_details;

    var powerNumber = new BigNumber('10').toPower(contractDetails.decimals || 0);
    contractDetails.token_holders.map(function(holder) {
        holder.amount = new BigNumber(holder.amount).div(powerNumber).toString(10);
    });

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
    $scope.chartData = angular.copy(contractDetails.token_holders);
}).controller('tokenMintController', function($scope, $timeout, APP_CONSTANTS, web3Service, NETWORKS_TYPES_CONSTANTS) {

    var contract = angular.copy($scope.ngPopUp.params.contract);

    web3Service.setProviderByNumber(contract.network);

    var web3Contract;

    var getTotalSupply = function() {
        web3Contract.methods.totalSupply().call(function(error, result) {
            if (error) {
                result = 0;
            }

            $scope.chartData.unshift({
                amount: new BigNumber(result).div(Math.pow(10, contract.contract_details.decimals)),
                name: 'Total Distributed (before)'
            });
            $scope.checkTokensAmount();
            $scope.$apply();
        });
    };


    $scope.minStartDate = moment();

    contract.contract_details.token_holders = [];

    $scope.recipient = {
        freeze_date: $scope.minStartDate.clone().add(1, 'minutes')
    };

    $scope.chartOptions = {
        itemValue: 'amount',
        itemLabel: 'address'
    };
    contract.contract_details.token_holders.push($scope.recipient);
    $scope.chartData = contract.contract_details.token_holders;
    $scope.contract = contract;

    $scope.checkTokensAmount = function() {
        var holdersSum = contract.contract_details.token_holders.reduce(function (val, item) {
            var value = new BigNumber(item.amount || 0);
            return value.plus(val);
        }, new BigNumber(0));
        var stringValue = holdersSum.toString(10);
        $scope.tokensAmountError = (holdersSum.toString(10) == 0) || isNaN(stringValue);
        if (!$scope.tokensAmountError) {
            $scope.totalSupply = {
                tokens: holdersSum.round(2).toString(10)
            };
            $timeout(function() {
                $scope.dataChanged();
                $scope.$apply();
            });
        }
    };
    $scope.dataChanged = function() {
        $scope.chartData = angular.copy(contract.contract_details.token_holders);
        $scope.chartOptions.updater ? $scope.chartOptions.updater() : false;
    };

    $scope.generateSignature = function() {
        var mintInterfaceMethod = web3Service.getMethodInterface(
            !$scope.recipient.isFrozen ? 'mint' : 'mintAndFreeze',
            contract.contract_details.eth_contract_token.abi);
        var powerNumber = new BigNumber('10').toPower(contract.contract_details.decimals || 0);
        var amount = new BigNumber($scope.recipient.amount).times(powerNumber).toString(10);

        var params = [$scope.recipient.address,
            amount
        ];
        if ($scope.recipient.isFrozen) {
            params.push($scope.recipient.freeze_date.format('X'));
        }
        $scope.mintSignature = (new Web3()).eth.abi.encodeFunctionCall(
            mintInterfaceMethod, params
        );
    };

    web3Service.getAccounts().then(function(result) {
        $scope.currentWallet = result.filter(function(wallet) {
            return wallet.wallet.toLowerCase() === contract.contract_details.admin_address.toLowerCase();
        })[0];
        web3Contract = web3Service.createContractFromAbi(contract.contract_details.eth_contract_token.address, contract.contract_details.eth_contract_token.abi);
        getTotalSupply();
    });

    $scope.successCodeCopy = function(contract, field) {
        contract.copied = contract.copied || {};
        contract.copied[field] = true;
        $timeout(function() {
            contract.copied[field] = false;
        }, 1000);
    };

    $scope.sendMintTransaction = function() {
        var powerNumber = new BigNumber('10').toPower(contract.contract_details.decimals || 0);
        var amount = new BigNumber($scope.recipient.amount).times(powerNumber).toString(10);
        if ($scope.recipient.isFrozen) {
            web3Contract.methods.mintAndFreeze(
                $scope.recipient.address,
                amount,
                $scope.recipient.freeze_date.format('X')
            ).send({
                from: $scope.currentWallet.wallet
            }).then(console.log);
        } else {
            web3Contract.methods.mint($scope.recipient.address, amount).send({
                from: $scope.currentWallet.wallet
            }).then(console.log);
        }
    };

    $scope.sendFinalizeTransaction = function() {
        web3Contract.methods.finishMinting().send({
            from: $scope.currentWallet.wallet
        }).then(console.log);
    };


}).controller('tokenMintFinalize', function($scope, web3Service) {

    web3Service.setProviderByNumber($scope.ngPopUp.params.contract.network);

    var contractDetails = $scope.ngPopUp.params.contract.contract_details, contract;

    var interfaceMethod = web3Service.getMethodInterface('finishMinting', contractDetails.eth_contract_token.abi);
    $scope.finalizeSignature = (new Web3()).eth.abi.encodeFunctionCall(interfaceMethod);

    web3Service.getAccounts().then(function(result) {
        $scope.currentWallet = result.filter(function(wallet) {
            return wallet.wallet.toLowerCase() === contractDetails.admin_address.toLowerCase();
        })[0];
        if ($scope.currentWallet) {
            web3Service.setProvider($scope.currentWallet.type);
            contract = web3Service.createContractFromAbi(contractDetails.eth_contract_token.address, contractDetails.eth_contract_token.abi);
        }
    });
    $scope.sendTransaction = function() {
        contract.methods.finishMinting().send({
            from: $scope.currentWallet.wallet
        }).then(console.log);
    };
});
