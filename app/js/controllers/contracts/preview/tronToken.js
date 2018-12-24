angular.module('app').controller('tronTokenPreviewController', function($timeout, $rootScope, contractService, $location,
                                                                    openedContract, $scope, $filter, TronService) {
    $scope.contract = openedContract.data;

    $scope.iniContract($scope.contract);

    $scope.blockchain = 'TRON';
    $scope.contractInfo = 'tron_contract_token';

    jQuery(function() {

        if ($scope.contract.state === 'ACTIVE') {

            var tokenContract = TronService.createContract(
                $scope.contract.contract_details.tron_contract_token.abi,
                $scope.contract.contract_details.tron_contract_token.address,
                $scope.contract.network
            );
            tokenContract.totalSupply().call().then(function(result) {
                $scope.contract.contract_details.totalSupply =
                    new BigNumber(result._hex).div(Math.pow(10, $scope.contract.contract_details.decimals));
                $timeout(function() {
                    generateChart();
                    $scope.$apply();
                });
            });
        }
    });


    var generateChart = function() {
        var contractDetails = $scope.contract.contract_details;

        var powerNumber = new BigNumber('10').toPower(contractDetails.decimals || 0);

        contractDetails.token_holders.map(function(holder) {
            holder.amount = new BigNumber(holder.amount).div(powerNumber).toString(10);
        });


        var beforeDistributed = {
            amount: 0,
            address: $filter('translate')('POPUP_FORMS.MINT_TOKENS_FORM.CHART.DISTRIBUTED_BEFORE')
        };

        var holdersSum = contractDetails.token_holders.reduce(function (val, item) {
            var value = new BigNumber(item.amount || 0);
            return value.plus(val);
        }, new BigNumber(0));



        $scope.totalSupply = {
            tokens: contractDetails.totalSupply
        };

        $scope.chartOptions = {
            itemValue: 'amount',
            itemLabel: 'address'
        };

        $scope.chartData = angular.copy(contractDetails.token_holders);

        beforeDistributed.amount = contractDetails.totalSupply.minus(holdersSum);

        if (beforeDistributed.amount > 0) {
            $scope.chartData.push(beforeDistributed);
        }

    };



}).controller('tronTokenMintFinalizeController', function($scope, TronService) {
    var contract = angular.copy($scope.ngPopUp.params.contract);

    console.log(contract);

    var tokenContract = TronService.createContract(
        contract.contract_details.tron_contract_token.abi,
        contract.contract_details.tron_contract_token.address,
        contract.network
    );

    var initedChain;

    TronService.connectToNetwork(contract.network).then(function(response) {
        initedChain = response.tronWeb;
    });

    $scope.closeExtensionAlert = function() {
        $scope.extensionNotInstalled =
            $scope.extensionNotAuthorized =
                $scope.extensionOtherUser =
                    $scope.successTx =
                        $scope.txServerError = false;
    };


    $scope.closeFinalizeForm = function() {
        $scope.$parent.$broadcast('$closePopUps');
    };


    $scope.sendTransaction = function() {
        if (!window.tronWeb) {
            $scope.extensionNotInstalled = true;
            return;
        } else if (!window.tronWeb.defaultAddress) {
            $scope.extensionNotAuthorized = true;
            return;
        } else if (
            (window.tronWeb.defaultAddress.hex !== contract.contract_details.admin_address) &&
            (window.tronWeb.defaultAddress.base58 !== contract.contract_details.admin_address)) {
            $scope.extensionOtherUser = true;
            return;
        }

        tokenContract.finishMinting().send().then(function(response) {
            // console.log(response);
            $scope.closeFinalizeForm();
            // $scope.successTx
        }, function() {
            $scope.txServerError = true;
        });
    };




}).controller('tronTokenMintController', function($scope, $timeout, APP_CONSTANTS, TronService, $filter) {

    var contract = angular.copy($scope.ngPopUp.params.contract);

    var tokenContract = TronService.createContract(
        contract.contract_details.tron_contract_token.abi,
        contract.contract_details.tron_contract_token.address,
        contract.network
    );

    var initedChain;

    TronService.connectToNetwork(contract.network).then(function(response) {
        initedChain = response.tronWeb;
        checkTotalSupply();
    });

    $scope.minStartDate = moment();
    contract.contract_details.token_holders = [];

    $scope.recipient = {
        freeze_date: $scope.minStartDate.clone().add(1, 'minutes')
    };

    $scope.chartOptions = {
        itemValue: 'amount',
        itemLabel: 'address'
    };


    var beforeDistributed = {
        amount: 0,
        address: $filter('translate')('POPUP_FORMS.MINT_TOKENS_FORM.CHART.DISTRIBUTED_BEFORE')
    };

    var chartData = [beforeDistributed];
    $scope.chartData = [];


    var totalSupply = {
        tokens: 0
    };

    $scope.closeExtensionAlert = function() {
        $scope.extensionNotInstalled =
            $scope.extensionNotAuthorized =
                $scope.extensionOtherUser =
                    $scope.successTx =
                        $scope.txServerError = false;
    };


    $scope.closeMintingForm = function() {
        $scope.$parent.$broadcast('$closePopUps');
    };


    $scope.sendMintTransaction = function() {
        if (!window.tronWeb) {
            $scope.extensionNotInstalled = true;
            return;
        } else if (!window.tronWeb.defaultAddress) {
            $scope.extensionNotAuthorized = true;
            return;
        } else if (
            (window.tronWeb.defaultAddress.hex !== contract.contract_details.admin_address) &&
            (window.tronWeb.defaultAddress.base58 !== contract.contract_details.admin_address)) {
            $scope.extensionOtherUser = true;
            return;
        }


        var powerNumber = new BigNumber('10').toPower(contract.contract_details.decimals || 0);
        var amount = new BigNumber($scope.recipient.amount).times(powerNumber).toString(10);

        if ($scope.recipient.isFrozen) {
            tokenContract.mintAndFreeze(
                $scope.recipient.address,
                amount,
                $scope.recipient.freeze_date.format('X')
            ).send().then(function(response) {
                // console.log(response);
                // $scope.successTx
            }, function() {
                $scope.txServerError = true;
            });
        } else {
            tokenContract.mint($scope.recipient.address, amount).send().then(function(response) {
                console.log(response);
                // $scope.successTx
            }, function(response) {
                $scope.txServerError = true;
            });
        }
    };

    $scope.checkTokensAmount = function() {
        $scope.chartData = angular.copy(chartData);
        $scope.totalSupply = angular.copy(totalSupply);


        if ($scope.mintForm && $scope.mintForm.$valid) {
            $scope.chartData.push($scope.recipient);
            $scope.totalSupply.tokens = $scope.totalSupply.tokens.plus($scope.recipient.amount);
        }
    };


    $scope.dataChanged = function() {
        $scope.chartOptions.updater ? $scope.chartOptions.updater() : false;
    };


    var checkTotalSupply = function() {
        if (!contract.contract_details.totalSupply) {
            tokenContract.totalSupply().call().then(function(result) {
                contract.contract_details.totalSupply =
                    new BigNumber(result._hex).div(Math.pow(10, contract.contract_details.decimals));

                totalSupply.tokens =
                    beforeDistributed.amount = contract.contract_details.totalSupply;

                $timeout(function() {
                    $scope.$apply();
                    $scope.checkTokensAmount();
                });
            });
        } else {
            totalSupply.tokens =
                beforeDistributed.amount = contract.contract_details.totalSupply;
            $scope.checkTokensAmount();
        }
    };

});
