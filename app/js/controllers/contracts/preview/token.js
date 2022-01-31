angular.module('app').controller('tokenPreviewController', function (
    $http,
    $timeout,
    $rootScope,
    contractService,
    $location,
    openedContract,
    $scope,
    $filter,
    web3Service
) {
    // console.log('tokenPreviewController',$scope,$rootScope);
    $scope.contract = openedContract.data;
    $scope.location = window.location;

    $scope.iniContract($scope.contract);

    var contractDetails = $scope.contract.contract_details, web3Contract;

    var getVerificationStatus = function () {
        contractService.getContract($scope.contract.id).then(function (response) {
            console.log('tokenPreviewController getVerificationStatus', response);
            $scope.contract.verification_status = response.data.contract_details.verification_status;
        });
    }
    getVerificationStatus();

    var getVerificationCost = function () {
        contractService.getVerificationCost().then(function (response) {
            console.log('tokenPreviewController getVerificationCost', response);
            $scope.contract.verificationCost = {
                USDT: new BigNumber(response.data.USDT).div(10e5).decimalPlaces(3).toString(10),
                WISH: new BigNumber(response.data.WISH).div(10e17).decimalPlaces(3).toString(10),
                ETH: new BigNumber(response.data.ETH).div(10e17).decimalPlaces(3).toString(10),
                BTC: new BigNumber(response.data.BTC).div(10e7).decimalPlaces(6).toString(10),
            };
        });
    }
    getVerificationCost();

    var getAuthioCost = function () {
        contractService.getAuthioCost().then(function (response) {
            console.log('tokenPreviewController getAuthioCost', response);
            $scope.contract.authioPrices = {
                USDT: new BigNumber(response.data.USDT).div(10e5).decimalPlaces(3).toString(10),
                WISH: new BigNumber(response.data.WISH).div(10e17).decimalPlaces(3).toString(10),
                ETH: new BigNumber(response.data.ETH).div(10e17).decimalPlaces(3).toString(10),
                BTC: new BigNumber(response.data.BTC).div(10e7).decimalPlaces(6).toString(10),
            };
        });
    }
    getAuthioCost();

    var getWhitelabelCost = function () {
        contractService.getWhitelabelCost().then(function (response) {
            // console.log('hecochainPreviewController getWhitelabelCost',response);
            $scope.contract.whitelabelCost = {
                USDT: new BigNumber(response.data.USDT).div(10e5).decimalPlaces(3).toString(10),
                WISH: new BigNumber(response.data.WISH).div(10e17).decimalPlaces(3).toString(10),
                ETH: new BigNumber(response.data.ETH).div(10e17).decimalPlaces(3).toString(10),
                BTC: new BigNumber(response.data.BTC).div(10e7).decimalPlaces(6).toString(10),
            };
        });
    }
    getWhitelabelCost();

    var tabs = ['code', 'info'];

    if ($scope.contract.isAuthioToken) {
        tabs.push('audit');
    }

    var updateTotalSupply = function () {
        web3Contract.methods.totalSupply().call(function (error, result) {
            if (error) {
                console.error(err)
                result = 0;
            }
            $scope.chartData = angular.copy(contractDetails.token_holders);
            $scope.chartData.unshift({
                amount: new BigNumber(result).minus(holdersSum).div(powerNumber),
                address: 'Other'
            });
            $scope.totalSupply = {
                tokens: new BigNumber(result).div(powerNumber)
            };
            console.log('ETH SUPPLY', result);
            $scope.$apply();
        });
    };


    var powerNumber = new BigNumber('10').exponentiatedBy(contractDetails.decimals || 0);
    var holdersSum = new BigNumber(0);

    contractDetails.token_holders.map(function (holder) {
        holdersSum = holdersSum.plus(holder.amount);
        holder.amount = new BigNumber(holder.amount).div(powerNumber).toString(10);
    });

    if (contractDetails.eth_contract_token && contractDetails.eth_contract_token.address) {
        web3Service.setProviderByNumber($scope.contract.network);
        web3Contract = web3Service.createContractFromAbi(
            contractDetails.eth_contract_token.address,
            contractDetails.eth_contract_token.abi
        );

        if (web3Contract.methods.freezingBalanceOf) {
            web3Contract.methods.freezingBalanceOf(contractDetails.admin_address.toLowerCase()).call(function (error, result) {
                if (error) return;
                if (result * 1) {
                    $scope.tokensFreezed = true;
                }
                $scope.$apply();
            });
        }
        updateTotalSupply();
    } else if (contractDetails.neo_contract_token && contractDetails.neo_contract_token.address) {
        var neoTotalSupply = {
            "jsonrpc": "2.0",
            "id": 1,
            "method": "invokefunction",
            "params": [
                contractDetails.neo_contract_token.script_hash.toString(),
                "totalSupply",
            ]
        }

        $http.post('https://neo-node.mywish.io', neoTotalSupply, {
            headers: {
                'Content-Type': 'application/json'
            }
        })
        .catch(function (e) {
            console.error('Error from Neo-node', e);
            return null;
        })
        .then(function (res) {
            var supply = res ? res.data.result.stack[0].value : 0;

            $scope.chartData = angular.copy(contractDetails.token_holders);

            $scope.chartData.unshift({
                amount: new BigNumber(supply).minus(holdersSum).div(powerNumber),
                address: 'Other'
            });
            $scope.totalSupply = {
                tokens: new BigNumber(supply).div(powerNumber)
            };
            $scope.$apply();

        })
        $http.post('https://contracts.mywish.io/api/v1/convert_neo3_address_to_hex/', {'address': contractDetails.admin_address },{
            headers: {
                'Content-Type': 'application/json'
            }
        })
        .catch(function (e) {
            console.error('Error from /api/v1/convert_neo3_address_to_hex/', e);
            return null;
        })
        .then(function (res) {
            contractDetails.admin_address_neo_to_0x = res.data.address;
        })
    } else {
        $scope.chartData = angular.copy(contractDetails.token_holders);
        $scope.totalSupply = {
            tokens: holdersSum
        };
    }

    $scope.chartOptions = {
        itemValue: 'amount',
        itemLabel: 'address'
    };

    $scope.forMintInfo = {
        updateData: updateTotalSupply
    };

    if ($scope.contract.withAuthioForm) {
        $scope.authioFormRequest = {
            contract_id: $scope.contract.id,
            authio_email: $filter('isEmail')($rootScope.currentUser.username) ? $rootScope.currentUser.username : undefined
        };
    }

    if ($scope.contract.withVerificationForm) {
        $scope.verificationFormRequest = {
            contract_id: $scope.contract.id,
        };
    }

    if ($location.$$hash && (/^tab-.+/.test($location.$$hash))) {
        var tab = $location.$$hash.replace(/^tab-(.+$)/, '$1');
        if (tabs.indexOf(tab) !== -1) {
            $scope.$parent.showedTab = tab;
        }
    }


    switch ($scope.contract.network) {
        case 1:
        case 2:
            $scope.blockchain = 'ETH';
            $scope.contractInfo = 'eth_contract_token';
            break;
        case 5:
        case 6:
            $scope.blockchain = 'NEO';
            $scope.contractInfo = 'neo_contract_token';
            break;
    }


    $scope.authioBuyRequest = false;
    var authioBuy = function () {
        if ($scope.authioBuyRequest) return;
        $scope.authioBuyRequest = true;
        contractService.buyAuthio($scope.authioFormRequest).then(function (response) {
            contractService.getContract($scope.contract.id).then(function (response) {
                var newContractDetails = response.data.contract_details;
                $scope.contract.withAuthioForm = !newContractDetails.authio;
                if (!$scope.contract.withAuthioForm) {
                    $scope.contract.contract_details.authio = true;
                    $scope.contract.contract_details.authio_email = newContractDetails.authio_email;
                    $scope.contract.contract_details.authio_date_payment = newContractDetails.authio_date_payment;
                    $scope.contract.contract_details.authio_date_getting = newContractDetails.authio_date_getting;
                }
                $scope.authioBuyRequest = false;
            });
        }, function (err) {
            switch (err.status) {
                case 400:
                    switch (err.data.result) {
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
            $scope.authioBuyRequest = false;
        });
    };

    $scope.authioBuyPopup = {
        template: '/templates/popups/confirmations/authio-confirm-pay.html',
        class: 'deleting-contract',
        params: {
            contract: $scope.contract,
            confirmAuthioPayment: authioBuy
        }
    };

    $scope.verificationBuyRequest = false;
    var verificationBuy = function () {
        $scope.verificationBuyRequest = true;
        const params = { contract_id: $scope.contract.id }
        contractService.buyVerification(params).then(function (response) {
            console.log('buyVerification', response.data)
            $scope.verificationBuyRequest = false;
            window.location.reload();
            // contractService.getContract($scope.contract.id).then(function(response) {
            //     var newContractDetails = response.data.contract_details;
            // })
        }, function (err) {
            switch (err.status) {
                case 400:
                    switch (err.data.result) {
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

}).controller('tokenMintController', function ($scope, $timeout, APP_CONSTANTS, web3Service, $filter) {
    var contract = angular.copy($scope.ngPopUp.params.contract);
    $scope.contract = contract;

    web3Service.setProviderByNumber(contract.network);
    var web3Contract;

    $scope.minStartDate = moment();
    contract.contract_details.token_holders = [];

    $scope.recipient = {
        freeze_date: $scope.minStartDate.clone().add(1, 'minutes')
    };

    $scope.chartOptions = {
        itemValue: 'amount',
        itemLabel: 'address'
    };

    var getTotalSupply = function () {
        web3Service.setProviderByNumber(contract.network);
        web3Contract = web3Service.createContractFromAbi(
            contract.contract_details.eth_contract_token.address,
            contract.contract_details.eth_contract_token.abi
        );
        web3Contract.methods.totalSupply().call(function (error, result) {
            if (error) {
                result = 0;
            }


            totalSupply.tokens =
                beforeDistributed.amount =
                new BigNumber(result).div(Math.pow(10, contract.contract_details.decimals));

            $scope.checkTokensAmount();
            $timeout(function () {
                $scope.$apply();
            });
        });
    };
    getTotalSupply();

    var beforeDistributed = {
        amount: 0,
        address: $filter('translate')('POPUP_FORMS.MINT_TOKENS_FORM.CHART.DISTRIBUTED_BEFORE')
    };

    var totalSupply = {
        tokens: 0
    };

    var chartData = [beforeDistributed];
    $scope.chartData = [];

    $scope.checkTokensAmount = function () {
        $scope.chartData = angular.copy(chartData);
        $scope.totalSupply = angular.copy(totalSupply);

        if ($scope.mintForm.$valid) {
            $scope.chartData.push($scope.recipient);
            $scope.totalSupply.tokens = $scope.totalSupply.tokens.plus($scope.recipient.amount);
        }
    };

    $scope.dataChanged = function () {
        $scope.chartOptions.updater ? $scope.chartOptions.updater() : false;
    };
    $scope.mintSignature = {};

    // $scope.ngPopUp.mintInfo =
    //     $scope.ngPopUp.mintInfo || {};

    $scope.generateSignature = function () {
        if ($scope.recipient.address.slice(0, 3) === "xdc") {
            $scope.recipient.address = "0x" + $scope.recipient.address.slice(3);
        }

        var mintInterfaceMethod = web3Service.getMethodInterface(
            !$scope.recipient.isFrozen ? 'mint' : 'mintAndFreeze',
            contract.contract_details.eth_contract_token.abi);
        var powerNumber = new BigNumber('10').exponentiatedBy(contract.contract_details.decimals || 0);
        var amount = new BigNumber($scope.recipient.amount).times(powerNumber).toString(10);

        var params = [$scope.recipient.address.toLowerCase(), amount];

        if ($scope.recipient.isFrozen) {
            params.push($scope.recipient.freeze_date.format('X'));
        }
        $scope.mintSignature.string = (new Web3()).eth.abi.encodeFunctionCall(
            mintInterfaceMethod, params
        );


        web3Service.getAccounts(contract.network).then(function (result) {
            $scope.currentWallet = result.filter(function (wallet) {
                return wallet.wallet.toLowerCase() === contract.contract_details.admin_address.toLowerCase();
            })[0];
            if ($scope.currentWallet) {
                web3Service.setProvider($scope.currentWallet.type, contract.network);
            }
            $scope.currentWallet = $scope.currentWallet ? $scope.currentWallet : true;
            web3Contract = web3Service.createContractFromAbi(contract.contract_details.eth_contract_token.address, contract.contract_details.eth_contract_token.abi);
            $timeout(function () {
                $scope.$apply();
            });
        });

    };

    $scope.sendMintTransaction = function () {
        $scope.generateSignature();
        $scope.wrongAddress = false;
        $scope.wrongNet = false;
        var powerNumber = new BigNumber('10').exponentiatedBy(contract.contract_details.decimals || 0);
        var amount = new BigNumber($scope.recipient.amount).times(powerNumber).toString(10);

        var txProgress;
        if ($scope.ngPopUp.mintInfo) {
            $scope.ngPopUp.mintInfo.isProgress = true;
        }

        web3Service.getAccounts($scope.contract.network).then(function (result) {
            if (!result.length || !result) {
                $scope.wrongNet = true;
            }

            $scope.currentWallet = result.filter(function (wallet) {
                if (wallet.wallet.toLowerCase() !== $scope.contract.contract_details.admin_address.toLowerCase()) {
                    $scope.wrongAddress = true;
                    $scope.wrongNet = false;
                } else {
                    $scope.wrongAddress = false;
                }
                return wallet.wallet.toLowerCase() === $scope.contract.contract_details.admin_address.toLowerCase();
            })[0];

            if ($scope.currentWallet) {
                if ($scope.recipient.isFrozen) {
                    txProgress = web3Contract.methods.mintAndFreeze(
                        $scope.recipient.address,
                        amount,
                        $scope.recipient.freeze_date.format('X')
                    ).send({
                        from: $scope.currentWallet.wallet
                    });
                } else {
                    txProgress = web3Contract.methods.mint($scope.recipient.address.toLowerCase(), amount).send({
                        from: $scope.currentWallet.wallet
                    });
                }
                txProgress.then(function () {
                    if ($scope.ngPopUp.mintInfo) {
                        $scope.ngPopUp.mintInfo.updateData ?
                            $scope.ngPopUp.mintInfo.updateData() : false;
                    }
                }).finally(function () {
                    if ($scope.ngPopUp.mintInfo) {
                        $scope.ngPopUp.mintInfo.isProgress = false;
                    }
                    $scope.$apply();
                })

            } else {
                if ($scope.ngPopUp.mintInfo) {
                    $scope.ngPopUp.mintInfo.isProgress = false;
                }
                $scope.openPopup();
            }
        });


    };
    $scope.sendFinalizeTransaction = function () {
        web3Contract.methods.finishMinting().send({
            from: $scope.currentWallet.wallet
        }).then(console.log);
    };
    $scope.isXinfin = function (item) {
        if (item.slice(0, 3) === 'xdc') {
            return "0x" + item.slice(3);
        }
        return item;
    }
    $scope.openPopup = function () {
        $scope.wrongData = true;
    };

    $scope.checkNet = function () {
        $scope.wrongData = false;
        $scope.wrongAddress = false;
        $scope.wrongNet = false;
    };


}).controller('tokenMintFinalize', function ($scope, web3Service) {

    web3Service.setProviderByNumber($scope.ngPopUp.params.contract.network);

    var contractDetails = $scope.ngPopUp.params.contract.contract_details, contract;

    var interfaceMethod = web3Service.getMethodInterface('finishMinting', contractDetails.eth_contract_token.abi);
    $scope.finalizeSignature = (new Web3()).eth.abi.encodeFunctionCall(interfaceMethod);

    $scope.sendTransaction = function () {

        $scope.wrongAddress = false;
        $scope.wrongNet = false;

        web3Service.getAccounts($scope.ngPopUp.params.contract.network).then(function (result) {
            if (!result.length || !result) {
                $scope.wrongNet = true;
            }
            $scope.currentWallet = result.filter(function (wallet) {
                if (wallet.wallet.toLowerCase() !== contractDetails.admin_address.toLowerCase()) {
                    $scope.wrongAddress = true;
                } else {
                    $scope.wrongAddress = false;
                }
                return wallet.wallet.toLowerCase() === contractDetails.admin_address.toLowerCase();
            })[0];

            if ($scope.currentWallet) {
                web3Service.setProvider($scope.currentWallet.type, $scope.ngPopUp.params.contract.network);
                contract = web3Service.createContractFromAbi(contractDetails.eth_contract_token.address, contractDetails.eth_contract_token.abi);

                contract.methods.finishMinting().send({
                    from: $scope.currentWallet.wallet
                }).then(console.log);

            } else {
                $scope.openPopup();
            }
        });

    };
    $scope.openPopup = function () {
        $scope.wrongData = true;
    };

    $scope.checkNet = function () {
        $scope.wrongData = false;
        $scope.wrongAddress = false;
        $scope.wrongNet = false;
    };

    $scope.isXinfin = function (item) {
        if (item.slice(0, 3) === 'xdc') {
            return "0x" + item.slice(3);
        }
        return item;
    }
});
