angular.module('app').controller('tokensLostKeyPreviewController', function($timeout, $rootScope, contractService, $state, $q,
                                                                          openedContract, $scope, $http, web3Service, $location) {
    $scope.contract = openedContract.data;
    $scope.iniContract($scope.contract);

    var contractDetails = $scope.contract.contract_details;

    var tabs = ['tokens', 'info', 'code'];

    $scope.maximumTokens = 400;

    $scope.showedTab = $location.hash().replace('#', '');

    web3Service.setProviderByNumber($scope.contract.network);

    if (tabs.indexOf($scope.showedTab) === -1) {
        $scope.showedTab = tabs[1];
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

    var checkLostKeyContract = function() {

        web3Service.getEthTokensForAddress(
            contractDetails.user_address,
            $scope.contract.network
        ).then(function(result) {
            var tokens = result.data;
            lostKeyContract.methods.getTokenAddresses().call().then(function(addedTokens) {
                tokens.forEach(function(token) {
                    var tokenInfo = token.token_info;
                    tokenInfo.balanceOf = token.balance;
                    var tokenIsConfirmed = !!addedTokens.filter(function(t) {
                        return t.toLowerCase() === tokenInfo.address;
                    }).length;
                    addedTokens = addedTokens.filter(function(t) {
                        return t.toLowerCase() !== tokenInfo.address;
                    });
                    checkTokenInfo(tokenInfo.address, ['allowance', 'balanceOf'], tokenInfo).then(function(tokenResult) {
                        tokenResult.confirmed = tokenIsConfirmed;
                        $scope.visibleTokensList.push(tokenResult);
                    });
                });
                addedTokens.forEach(function(tokenAddress) {
                    var confirmedTokenAddress = tokenAddress.toLowerCase();
                    checkTokenInfo(confirmedTokenAddress).then(function(tokenInfo) {
                        tokenInfo.confirmed = true;
                        $scope.visibleTokensList.push(tokenInfo);
                    });
                });
            });
        });
    };

    $scope.tokenAddressReady = false;

    $scope.customAddressCheck = {
        isProgressAddresses: []
    };

    var lostKeyContract;


    if ($scope.contract.stateValue === 4) {
        $scope.visibleTokensList = [];
        lostKeyContract = web3Service.createContractFromAbi(
            contractDetails.eth_contract.address,
            contractDetails.eth_contract.abi
        );
        checkLostKeyContract();
    }


    var checkTokenInfo = function(address, customInfo, advTokenData) {
        var tokenData = customInfo || ['decimals', 'symbol', 'balanceOf', 'name', 'allowance'];
        var defer = $q.defer();
        var web3TokenContract = web3Service.createContractFromAbi(
            address, window.abi
        );
        var checkedTokenData = {};
        var sch = tokenData.length;
        var currMethod;

        tokenData.map(function(method) {
            var methodFn = web3TokenContract.methods[method];

            switch(method) {
                case 'balanceOf':
                    currMethod = methodFn(contractDetails.user_address);
                    break;
                case 'allowance':
                    currMethod = methodFn(
                        contractDetails.user_address,
                        $scope.contract.contract_details.eth_contract.address);
                    break;
                default:
                    currMethod = methodFn();
                    break;
            }
            currMethod.call(function(err, result) {
                if (err === null) {
                    checkedTokenData[method] = result;
                    sch--;
                    if (!sch) {
                        checkedTokenData.address = address;
                        checkedTokenData.balance = new BigNumber(checkedTokenData.balanceOf).div(Math.pow(10, checkedTokenData.decimals)).toString(10);
                        checkedTokenData = advTokenData ? angular.merge(advTokenData, checkedTokenData) : checkedTokenData;
                        checkedTokenData.checked = true;
                        checkedTokenData.allowed = new BigNumber(checkedTokenData.allowance) > 0;
                        defer.resolve(checkedTokenData);
                    }
                } else {
                    defer.reject();
                }
            });
        });
        return defer.promise;
    };

    var checkTokenAddress = function(token_address) {
        var defer = $q.defer();
        var address = token_address.$viewValue.toLowerCase();
        checkTokenInfo(address).then(function(result) {
            defer.resolve(result);
            token_address.$setValidity('contract-address', true);
        }, function() {
            defer.reject();
            token_address.$setValidity('contract-address', false);
        });
        return defer.promise;
    };

    $scope.resetTokenAddress = function(tokenAddress) {
        tokenAddress.$error['contract-address'] ?
            tokenAddress.$setValidity('contract-address', true) : false;

        tokenAddress.$error['allowance-address'] ?
            tokenAddress.$setValidity('allowance-address', true) : false;
    };

    $scope.closeAllowTokenPopup = function() {
        $scope.tokenAddressReady = false;
    };

    $scope.closeConfirmTokenPopup = function() {
        $scope.tokenConfirmAddressReady = false;
    };

    $scope.closeAllConfirmTokenPopup = function() {
        $scope.allTokenConfirmAddressReady = false;
    };

    $scope.confirmToken = function(token) {
        $scope.tokenConfirmAddressReady = {
            token: token,
            contract: $scope.contract
        };
    };

    $scope.allowToken = function(token) {
        $scope.tokenAddressReady = {
            token: token,
            customField: $scope.customAddressCheck,
            lostKeyContract: {
                address: $scope.contract.contract_details.eth_contract.address
            },
            contract: {
                address: token.address,
                network: $scope.contract.network,
                admin_address: $scope.contract.contract_details.user_address
            }
        };
    };

    $scope.allowCustomToken = function(tokenAddress) {
        var address = tokenAddress.$viewValue.toLowerCase();
        var currentToken = $scope.visibleTokensList.filter(function(existsToken) {
            return existsToken.address === address;
        })[0];
        if (currentToken) {
            if (!currentToken.allowed) {
                $scope.allowToken(currentToken, tokenAddress);
            } else {
                tokenAddress.$setValidity('allowance-address', false);
            }
            return;
        }

        checkTokenAddress(tokenAddress).then(function(web3TokenContract) {
            tokenAddress.$setValidity('allowance-address', !web3TokenContract.allowed);
            web3TokenContract.confirmed = false;
            $scope.visibleTokensList.push(web3TokenContract);
            if (!web3TokenContract.allowed) {
                $scope.allowToken(web3TokenContract);
            }
        }, function() {
            console.log('Not token');
        });
    };

    $scope.callAddTokens = function() {
        var notConfirmedTokens = $scope.visibleTokensList.filter(function(token) {
            return !token.confirmed && token.allowed;
        });

        $scope.allTokenConfirmAddressReady = {
            tokens_addresses: notConfirmedTokens,
            contract: $scope.contract
        };
    };

}).controller('tokenLostKeyAllowController', function($scope, web3Service) {
    web3Service.setProviderByNumber($scope.ngPopUp.params.contract.network);

    var TOKENS_SUM = new BigNumber(2).pow(256).minus(1).toString(10);

    var contractDetails = $scope.ngPopUp.params.contract, contract;
    $scope.contract = $scope.ngPopUp.params.contract;

    var interfaceMethod = web3Service.getMethodInterface('approve', window.abi);

    $scope.allowTokenSignature = (new Web3()).eth.abi.encodeFunctionCall(interfaceMethod, [
        $scope.ngPopUp.params.lostKeyContract.address,
        TOKENS_SUM
    ]);

    web3Service.getAccounts($scope.ngPopUp.params.contract.network).then(function(result) {
        $scope.currentWallet = result.filter(function(wallet) {
            return wallet.wallet.toLowerCase() === contractDetails.admin_address.toLowerCase();
        })[0];
        if ($scope.currentWallet) {
            web3Service.setProvider($scope.currentWallet.type, $scope.ngPopUp.params.contract.network);
        }
        contract = web3Service.createContractFromAbi(contractDetails.address, window.abi);
    });

    $scope.sendTransaction = function() {
        $scope.ngPopUp.params.token.isAllowProgress = true;
        $scope.ngPopUp.params.customField.isProgressAddresses[$scope.ngPopUp.params.token.address] = true;

        contract.methods.approve(
            $scope.ngPopUp.params.lostKeyContract.address,
            TOKENS_SUM
        ).send({
            from: $scope.currentWallet.wallet
        }).then(function() {
            $scope.ngPopUp.params.token.allowed = true;
        }).finally(function() {
            $scope.ngPopUp.params.token.isAllowProgress = false;
            $scope.$apply();
            $scope.ngPopUp.params.customField.isProgressAddresses[$scope.ngPopUp.params.token.address] = false;
        });
    };

}).controller('allTokenLostKeyConfirmController', function($scope, web3Service) {
    web3Service.setProviderByNumber($scope.ngPopUp.params.contract.network);

    var contractDetails = $scope.ngPopUp.params.contract, contract;

    var interfaceMethod = web3Service.getMethodInterface(
        'addTokenAddresses',
        contractDetails.contract_details.eth_contract.abi
    );

    var tokenAddresses = $scope.ngPopUp.params.tokens_addresses;
    var tokensList = tokenAddresses.map(function(token) {
        return token.address;
    });
    $scope.confirmTokenSignature = (new Web3()).eth.abi.encodeFunctionCall(interfaceMethod, [
        tokensList
    ]);


    web3Service.getAccounts(contractDetails.network).then(function(result) {
        $scope.currentWallet = result.filter(function(wallet) {
            return wallet.wallet.toLowerCase() === contractDetails.contract_details.user_address.toLowerCase();
        })[0];
        if ($scope.currentWallet) {
            web3Service.setProvider($scope.currentWallet.type, contractDetails.network);
        }
        contract = web3Service.createContractFromAbi(
            contractDetails.contract_details.eth_contract.address,
            contractDetails.contract_details.eth_contract.abi
        );
    });

    $scope.sendTransaction = function() {
        tokenAddresses.forEach(function(t) {
            t.isConfirmProgress = true;
        });
        contract.methods.addTokenAddresses(
            tokensList
        ).send({
            from: $scope.currentWallet.wallet
        }).then(function() {
            tokenAddresses.forEach(function(t) {
                t.confirmed = true;
            });
        }).finally(function() {
            tokenAddresses.forEach(function(t) {
                t.isConfirmProgress = false;
            });
            $scope.$apply();
        });
    };

}).controller('tokenLostKeyConfirmController', function($scope, web3Service) {
    web3Service.setProviderByNumber($scope.ngPopUp.params.contract.network);

    var contractDetails = $scope.ngPopUp.params.contract, contract;

    var interfaceMethod = web3Service.getMethodInterface(
        'addTokenAddress',
        contractDetails.contract_details.eth_contract.abi
    );

    $scope.confirmTokenSignature = (new Web3()).eth.abi.encodeFunctionCall(interfaceMethod, [
        contractDetails.address
    ]);

    web3Service.getAccounts(contractDetails.network).then(function(result) {
        $scope.currentWallet = result.filter(function(wallet) {
            return wallet.wallet.toLowerCase() === contractDetails.contract_details.user_address.toLowerCase();
        })[0];
        if ($scope.currentWallet) {
            web3Service.setProvider($scope.currentWallet.type, contractDetails.network);
        }
        contract = web3Service.createContractFromAbi(
            contractDetails.contract_details.eth_contract.address,
            contractDetails.contract_details.eth_contract.abi
        );
    });

    $scope.sendTransaction = function() {
        $scope.ngPopUp.params.token.isConfirmProgress = true;
        contract.methods.addTokenAddress(
            $scope.ngPopUp.params.token.address
        ).send({
            from: $scope.currentWallet.wallet
        }).then(function() {
            $scope.ngPopUp.params.token.confirmed = true;
        }).finally(function() {
            $scope.ngPopUp.params.token.isConfirmProgress = false;
            $scope.$apply();
        });
    };

}).controller('tokenLostKeyCancelController', function ($scope, web3Service) {
    web3Service.setProviderByNumber($scope.ngPopUp.params.contract.network);
    var contractDetails = $scope.ngPopUp.params.contract, contract;
    var interfaceMethod = web3Service.getMethodInterface(
        'kill',
        contractDetails.contract_details.eth_contract.abi
    );
    $scope.killSignature = (new Web3()).eth.abi.encodeFunctionCall(interfaceMethod, []);
    web3Service.getAccounts(contractDetails.network).then(function(result) {
        $scope.currentWallet = result.filter(function(wallet) {
            return wallet.wallet.toLowerCase() === contractDetails.contract_details.user_address.toLowerCase();
        })[0];
        if ($scope.currentWallet) {
            web3Service.setProvider($scope.currentWallet.type, contractDetails.network);
        }
        contract = web3Service.createContractFromAbi(
            contractDetails.contract_details.eth_contract.address,
            contractDetails.contract_details.eth_contract.abi
        );
    });
    $scope.sendTransaction = function() {
        contractDetails.killProgress = true;
        contract.methods.kill().send({
            from: $scope.currentWallet.wallet
        }).finally(function() {
            contractDetails.killProgress = false;
            $scope.$apply();
        });
    };

}).controller('tokenLostKeyImAlievController', function ($scope, web3Service) {
    web3Service.setProviderByNumber($scope.ngPopUp.params.contract.network);
    var contractDetails = $scope.ngPopUp.params.contract, contract;
    var interfaceMethod = web3Service.getMethodInterface(
        'imAvailable',
        contractDetails.contract_details.eth_contract.abi
    );
    $scope.iAliveSignature = (new Web3()).eth.abi.encodeFunctionCall(interfaceMethod, []);
    web3Service.getAccounts(contractDetails.network).then(function(result) {
        $scope.currentWallet = result.filter(function(wallet) {
            return wallet.wallet.toLowerCase() === contractDetails.contract_details.user_address.toLowerCase();
        })[0];
        if ($scope.currentWallet) {
            web3Service.setProvider($scope.currentWallet.type, contractDetails.network);
        }
        contract = web3Service.createContractFromAbi(
            contractDetails.contract_details.eth_contract.address,
            contractDetails.contract_details.eth_contract.abi
        );
    });
    $scope.sendTransaction = function() {
        contractDetails.imAliveProgress = true;
        contract.methods.imAvailable().send({
            from: $scope.currentWallet.wallet
        }).finally(function() {
            contractDetails.imAliveProgress = false;
            $scope.$apply();
        });
    };
});
