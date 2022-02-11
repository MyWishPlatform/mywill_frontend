angular.module('app').controller('tronTokenPreviewController', function($timeout, $rootScope, contractService, $location,
                                                                    openedContract, $scope, $filter, TronService) {
    console.log('tronTokenPreviewController', $scope)
    $scope.contract = openedContract.data;

    $scope.iniContract($scope.contract);

    var contractDetails = $scope.contract.contract_details;


    var getVerificationStatus = function () {
        contractService.getContract($scope.contract.id).then(function(response) {
            console.log('tronAirdropPreviewController getVerificationStatus',response);
            $scope.contract.verification_status = response.data.contract_details.verification_status;
        });
    }
    getVerificationStatus();

    var getVerificationCost = function () {
        contractService.getVerificationCost().then(function(response) {
            console.log('tronAirdropPreviewController getVerificationCost',response);
            $scope.contract.verificationCost = {
                USDT: new BigNumber(response.data.USDT).div(10e5).toFixed(2).toString(10),
                WISH: new BigNumber(response.data.WISH).div(10e17).toFixed(3).toString(10),
                ETH: new BigNumber(response.data.ETH).div(10e17).toFixed(3).toString(10),
                BTC: new BigNumber(response.data.BTC).div(10e7).toFixed(6).toString(10),
            };
        });
    }
    getVerificationCost();


    contractDetails.admin_address = TronWeb.address.fromHex(contractDetails.admin_address);

    var powerNumber = new BigNumber('10').exponentiatedBy(contractDetails.decimals || 0);
    contractDetails.token_holders.map(function(holder) {
        if (TronWeb.isAddress(holder.address)) {
            holder.address = TronWeb.address.fromHex(holder.address);
        }
        holder.amount = new BigNumber(holder.amount).div(powerNumber).toString(10);
    });

    $scope.blockchain = 'TRON';
    $scope.contractInfo = 'tron_contract_token';

    if (contractDetails.tron_contract_token.address) {
        contractDetails.tron_contract_token.address = TronWeb.address.fromHex(contractDetails.tron_contract_token.address);
    }

    var checkTotalSupply = function() {
        TronService.createContract(
            contractDetails.tron_contract_token.abi,
            contractDetails.tron_contract_token.address,
            $scope.contract.network
        ).then(function(contract) {
            contract.totalSupply().call().then(function(result) {
                $scope.contract.contract_details.totalSupply =
                    new BigNumber(result._hex).div(Math.pow(10, $scope.contract.contract_details.decimals));
                $timeout(function() {
                    generateChart();
                    $scope.$apply();
                });
            });
        });

    };

    jQuery(function() {
        if ($scope.contract.state === 'ACTIVE') {
            checkTotalSupply();
        }
    });

    var generateChart = function() {
        var powerNumber = new BigNumber('10').exponentiatedBy(contractDetails.decimals || 0);

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

        beforeDistributed.amount = contractDetails.totalSupply.minus(holdersSum).toString(10);

        if (beforeDistributed.amount > 0) {
            $scope.chartData.push(beforeDistributed);
        }
    };

    $scope.reGenerateChart = checkTotalSupply;

    $scope.verificationBuyRequest = false;
    var verificationBuy = function() {
        $scope.verificationBuyRequest = true;
        const params = {contract_id: $scope.contract.id}
        contractService.buyVerification(params).then(function(response) {
            console.log('buyVerification',response.data)
            $scope.verificationBuyRequest = false;
            window.location.reload();
        }, function(err) {
            switch (err.status) {
                case 400:
                    switch(err.data.result) {
                        case 3:
                        case "3":
                            $rootScope.commonOpenedPopupParams = {
                                newPopupContent: true
                            };
                            $rootScope.commonOpenedPopup = 'errors/authio-less-balance';
                            break;
                    }
                    break;
            }
            $scope.verificationBuyRequest = false;
        });
    };
    $rootScope.contract = $scope.contract
    $rootScope.confirmVerificationPayment = verificationBuy
}).controller('tronTokenMintFinalizeController', function($scope, TronService) {
    var contract = $scope.contract = angular.copy($scope.ngPopUp.params.contract);

    var tokenContract;

    TronService.createContract(
        contract.contract_details.tron_contract_token.abi,
        contract.contract_details.tron_contract_token.address,
        contract.network
    ).then(function(result) {
        tokenContract = result;
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
            $scope.successTx = {
                transaction_id: response
            };
            $scope.$apply();
        }, function(response) {
            $scope.txServerError = true;
            $scope.$apply();
        });
    };




}).controller('tronTokenMintController', function($scope, $timeout, APP_CONSTANTS, TronService, $filter) {

    var contract = $scope.contract = angular.copy($scope.ngPopUp.params.contract);

    var tokenContract;

    TronService.createContract(
        contract.contract_details.tron_contract_token.abi,
        contract.contract_details.tron_contract_token.address,
        contract.network
    ).then(function(result) {
        tokenContract = result;
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


    var reGenerateChart = function() {
        console.log($scope.ngPopUp);
        if ($scope.ngPopUp.reGenerateChart) {
            $scope.ngPopUp.reGenerateChart();
        }
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


        var powerNumber = new BigNumber('10').exponentiatedBy(contract.contract_details.decimals || 0);
        var amount = new BigNumber($scope.recipient.amount).times(powerNumber).toString(10);

        if ($scope.recipient.isFrozen) {
            tokenContract.mintAndFreeze(
                $scope.recipient.address,
                amount,
                $scope.recipient.freeze_date.format('X')
            ).send().then(function(response) {
                $scope.successTx = {
                    transaction_id: response
                };
                reGenerateChart();
                $scope.$apply();
            }, function(error) {
                alert(JSON.stringify(error));
                $scope.txServerError = true;
                $scope.$apply();
            });
        } else {
            tokenContract.mint($scope.recipient.address, amount).send().then(function(response) {
                $scope.successTx = {
                    transaction_id: response
                };
                reGenerateChart();
                $scope.$apply();
            }, function(error) {
                alert(JSON.stringify(error));
                $scope.txServerError = true;
                $scope.$apply();
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
