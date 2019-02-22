angular.module('app').controller('tronLostKeyPreviewController', function($timeout, $rootScope, contractService, $state,
                                                                          openedContract, $scope, $http, TronService) {
    $scope.contract = openedContract.data;
    $scope.setContract($scope.contract);

    var contractDetails = $scope.contract.contract_details;
    if (contractDetails.tron_contract && contractDetails.tron_contract.address) {
        contractDetails.tron_contract.address = TronWeb.address.fromHex(contractDetails.tron_contract.address);
    }

    var durationList = [
        {
            value: 365,
            name: 'YEARS'
        }, {
            value: 30,
            name: 'MONTHS'
        }, {
            value: 1,
            name: 'DAYS'
        }
    ];

    var checkInterval = durationList.filter(function(check) {
        return !(contractDetails.check_interval % (check.value * 24 * 3600));
    })[0];

    contractDetails.check_interval = {
        period: contractDetails.check_interval / (checkInterval.value * 24 * 3600),
        periodUnit: checkInterval.name
    };


    var tronContract;


    var checkLostKeyContract = function() {
        return TronService.createContract(
            contractDetails.tron_contract.abi,
            contractDetails.tron_contract.address,
            $scope.contract.network
        );
    };

    var checkTokenContract = function(token) {
        TronService.getContract(token.contract_address, $scope.contract.network).then(function(response) {
            token.contract = response;
            TronService.callContract(response, $scope.contract.network).then(function(tokenContract) {
                tokenContract.allowance(
                    TronWeb.address.toHex(contractDetails.user_address),
                    TronWeb.address.toHex(contractDetails.tron_contract.address)
                ).call().then(function(response) {
                    token.allowed = new BigNumber(response) > 0;
                    token.isAllowProgress = false;
                    $scope.$apply();
                });
            });
        }, console.log);
    };

    var getAllUserTokens = function(addedTokens) {

        TronService.getAccountAdvancedInfo(contractDetails.user_address, $scope.contract.network).then(
            function(response) {
                $scope.visibleTokensList = response.data.trc20token_balances;
                $scope.visibleTokensList.map(function(token) {
                    token.contract_address = TronWeb.address.fromHex(token.contract_address);
                    token.visibleBalance = new BigNumber(token.balance).div(Math.pow(10, token.decimals));
                    token.confirmed = addedTokens.indexOf(TronWeb.address.toHex(token.contract_address)) > -1;
                    token.isAllowProgress  = true;
                    if (!token.confirmed) {
                        checkTokenContract(token);
                    } else {
                        token.allowed = true;
                        token.isAllowProgress  = false;
                    }
                });
            }
        );
    };

    if ($scope.contract.stateValue === 4) {
        checkLostKeyContract().then(function(lostKeyContract) {
            tronContract = lostKeyContract;
            tronContract.getTokenAddresses().call().then(function(result) {
                result = result.map(function(addr) {
                    return addr.replace(/^0x/, '41').toLowerCase();
                });
                getAllUserTokens(result);
            }, function() {
                console.log(arguments);
            })
        });
    }


    $scope.visibleTokensList = [];


    $scope.closeExtensionAlert = function() {
        $scope.TRONExtensionInfo = {
            extensionNotInstalled: false,
            extensionNotAuthorized: false,
            extensionOtherUser: false,
            txServerError: false,
            successTx: false,
            network: $scope.contract.network
        };
    };

    $scope.closeExtensionAlert();


    var isSuccessExtension = function() {
        var address = contractDetails.user_address;
        if (!window.tronWeb) {
            $scope.TRONExtensionInfo.extensionNotInstalled = true;
            return;
        } else if (!window.tronWeb.defaultAddress.hex) {
            $scope.TRONExtensionInfo.extensionNotAuthorized = true;
            return;
        } else if (
            (window.tronWeb.defaultAddress.hex !== address) &&
            (window.tronWeb.defaultAddress.base58 !== address)) {
            $scope.TRONExtensionInfo.extensionOtherUser = true;
            return;
        }
        return true;
    };


    var TOKENS_SUM = new BigNumber(2).pow(256).minus(1).toString(10);
    $scope.allowToken = function(token) {
        if (!isSuccessExtension()) return;
        token.isAllowProgress  = true;

        TronService.callContract(token.contract, $scope.contract.network).then(function(tokenContract) {
            tokenContract.approve(
                TronWeb.address.toHex(contractDetails.tron_contract.address), TOKENS_SUM
            ).send().then(
                function(result) {
                    $scope.TRONExtensionInfo.successTx = {
                        transaction_id: result
                    };
                    token.allowed = true;
                    $scope.$apply();
                },
                function() {
                    $scope.TRONExtensionInfo.txServerError = true;
                    $scope.$apply();
                }
            ).finally(function() {
                token.isAllowProgress  = false;
                $scope.$apply();
            })
        });
    };


    $scope.contract.isAllConfirmProgress = false;
    $scope.callAddTokens = function() {
        if (!isSuccessExtension()) return;

        var notConfirmedTokens = $scope.visibleTokensList.filter(function(token) {
            return !token.confirmed && token.allowed;
        });

        var tokensList = notConfirmedTokens.map(function(token) {
            token.isAllowProgress = true;
            return TronWeb.address.toHex(token.contract_address);
        });
        $scope.contract.isAllConfirmProgress = true;
        tronContract.addTokenAddresses(tokensList).send().then(
            function(result) {
                $scope.TRONExtensionInfo.successTx = {
                    transaction_id: result
                };

                notConfirmedTokens.forEach(function(token) {
                    token.confirmed = true;
                });

                $scope.$apply();
            },
            function() {
                $scope.TRONExtensionInfo.txServerError = true;
                $scope.$apply();
            }
        ).finally(function() {
            notConfirmedTokens.forEach(function(token) {
                token.isAllowProgress = false;
            });
            $scope.contract.isAllConfirmProgress = false;
            $scope.$apply();
        });
    };


    $scope.confirmToken = function(token) {
        if (!isSuccessExtension()) return;

        token.isAllowProgress  = true;
        tronContract.addTokenAddress(TronWeb.address.toHex(token.contract_address)).send().then(
            function(result) {
                $scope.TRONExtensionInfo.successTx = {
                    transaction_id: result
                };
                token.confirmed = true;
                $scope.$apply();
            },
            function() {
                $scope.TRONExtensionInfo.txServerError = true;
                $scope.$apply();
            }
        ).finally(function() {
            token.isAllowProgress  = false;
            $scope.$apply();
        });
    };

    $scope.onCancel = function() {
        $state.go('main.contracts.list');
    };

}).controller('tronLostKeyCancelController', function ($scope, TronService) {

    $scope.closeExtensionAlert = function() {
        $scope.TRONExtensionInfo = {
            extensionNotInstalled: false,
            extensionNotAuthorized: false,
            extensionOtherUser: false,
            txServerError: false,
            successTx: false,
            network: $scope.contract.network
        };
    };

    $scope.closeExtensionAlert();

    var isSuccessExtension = function() {
        var address = $scope.contract.contract_details.user_address;
        if (!window.tronWeb) {
            $scope.TRONExtensionInfo.extensionNotInstalled = true;
            return;
        } else if (!window.tronWeb.defaultAddress.hex) {
            $scope.TRONExtensionInfo.extensionNotAuthorized = true;
            return;
        } else if (
            (window.tronWeb.defaultAddress.hex !== address) &&
            (window.tronWeb.defaultAddress.base58 !== address)) {
            $scope.TRONExtensionInfo.extensionOtherUser = true;
            return;
        }
        return true;
    };


    $scope.callCancel = function() {
        TronService.createContract(
            $scope.contract.contract_details.tron_contract.abi,
            $scope.contract.contract_details.tron_contract.address,
            $scope.contract.network
        ).then(callCancel);
    };


    var callCancel = function(tronContract) {
        if (!isSuccessExtension()) return;
        $scope.contract.imCancelProgress  = true;
        tronContract.kill().send().then(
            function(result) {
                $scope.TRONExtensionInfo.successTx = {
                    transaction_id: result
                };
                if ($scope.onCancel) {
                    $scope.onCancel();
                }
                $scope.$apply();
            },
            function() {
                $scope.TRONExtensionInfo.txServerError = true;
                $scope.$apply();
            }
        ).finally(function() {
            $scope.contract.imCancelProgress = false;
            $scope.$apply();
        });
    }
}).controller('tronLostKeyImAlievController', function ($scope, TronService) {

    $scope.closeExtensionAlert = function() {
        $scope.TRONExtensionInfo = {
            extensionNotInstalled: false,
            extensionNotAuthorized: false,
            extensionOtherUser: false,
            txServerError: false,
            successTx: false,
            network: $scope.contract.network
        };
    };

    $scope.closeExtensionAlert();

    var isSuccessExtension = function() {
        var address = $scope.contract.contract_details.user_address;
        if (!window.tronWeb) {
            $scope.TRONExtensionInfo.extensionNotInstalled = true;
            return;
        } else if (!window.tronWeb.defaultAddress.hex) {
            $scope.TRONExtensionInfo.extensionNotAuthorized = true;
            return;
        } else if (
            (window.tronWeb.defaultAddress.hex !== address) &&
            (window.tronWeb.defaultAddress.base58 !== address)) {
            $scope.TRONExtensionInfo.extensionOtherUser = true;
            return;
        }
        return true;
    };


    $scope.callIALive = function() {
        TronService.createContract(
            $scope.contract.contract_details.tron_contract.abi,
            $scope.contract.contract_details.tron_contract.address,
            $scope.contract.network
        ).then(callIALive);
    };


    var callIALive = function(tronContract) {
        if (!isSuccessExtension()) return;
        $scope.contract.imAliveProgress  = true;
        tronContract.imAvailable().send().then(
            function(result) {
                $scope.TRONExtensionInfo.successTx = {
                    transaction_id: result
                };
                $scope.$apply();
            },
            function() {
                $scope.TRONExtensionInfo.txServerError = true;
                $scope.$apply();
            }
        ).finally(function() {
            $scope.contract.imAliveProgress = false;
            $scope.$apply();
        });
    }
});
