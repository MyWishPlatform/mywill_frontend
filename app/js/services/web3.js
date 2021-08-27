angular.module('Services').service('web3Service', function($q, $rootScope, APP_CONSTANTS, $timeout, requestService, API) {

    if (!window.Web3) return;
    var web3 = new Web3(), contract, _this = this;

    /* Определение провайдеров клиентов */
    var web3Providers = {};
    var createWeb3Providers = function() {
        try {
            web3Providers['metamask'] = Web3.givenProvider || new Web3.providers.WebsocketProvider("ws://localhost:8546");
        } catch(err) {
            console.log('Metamask not found');
        }
        try {
            web3Providers['parity'] = new Web3.providers.HttpProvider("http://localhost:8545");
        } catch(err) {
            console.log('Parity not found');
        }
        try {
            web3Providers['infura'] = new Web3.providers.HttpProvider(APP_CONSTANTS.INFURA_ADDRESS);
        } catch(err) {
            console.log('Infura not found');
        }
    };

    createWeb3Providers();
    /* Определение провайдеров клиентов */


    this.getMethodInterface = function(methodName, abi) {
        return abi.filter(function(m) {
            return m.name === methodName;
        })[0];
    };

    this.createContractFromAbi = function(contractAddress, abi) {
        var contract = new web3.eth.Contract(abi);
        if (contractAddress.slice(0,3) === 'xdc'){
            contractAddress = "0x" + contractAddress.slice(3);
        }
        contract.options.address = Web3.utils.toChecksumAddress(contractAddress);
        return contract;
    };

    var currentProvider;


    var isProduction = location.protocol === "https:";


    this.isProduction = function() {
        return isProduction;
    };


    this.setProviderByNumber = function(networkId) {

        networkId = networkId * 1;

        switch (networkId) {
            case 1:
                web3.setProvider(new Web3.providers.HttpProvider(isProduction ? APP_CONSTANTS.INFURA_ADDRESS : APP_CONSTANTS.ROPSTEN_INFURA_ADDRESS));
                break;
            case 2:
                web3.setProvider(new Web3.providers.HttpProvider(APP_CONSTANTS.ROPSTEN_INFURA_ADDRESS));
                break;
            case 3:
                web3.setProvider(new Web3.providers.HttpProvider(isProduction ? APP_CONSTANTS.RSK_NET_ADDRESS : APP_CONSTANTS.RSK_TESTNET_NET_ADDRESS));
                break;
            case 4:
                web3.setProvider(new Web3.providers.HttpProvider(APP_CONSTANTS.RSK_TESTNET_NET_ADDRESS));
                break;

            case 22:
                web3.setProvider(new Web3.providers.HttpProvider(isProduction ? APP_CONSTANTS.BNB_NET_ADDRESS : APP_CONSTANTS.BNB_TESTNET_NET_ADDRESS));
                break;
            case 23:
                web3.setProvider(new Web3.providers.HttpProvider(APP_CONSTANTS.BNB_TESTNET_NET_ADDRESS));
                break;

            case 24:
                web3.setProvider(new Web3.providers.HttpProvider(isProduction ? APP_CONSTANTS.MATIC_MAINNET_PROVIDER : APP_CONSTANTS.MATIC_TESTNET_PROVIDER));
                break;
            case 25:
                web3.setProvider(new Web3.providers.HttpProvider(APP_CONSTANTS.MATIC_TESTNET_PROVIDER));
                break;
            case 35:
                web3.setProvider(new Web3.providers.HttpProvider(APP_CONSTANTS.XINFIN_MAINNET_PROVIDER))
                break;
            case 28:
                web3.setProvider(new Web3.providers.HttpProvider(isProduction ? APP_CONSTANTS.HECOCHAIN_MAINNET_PROVIDER : APP_CONSTANTS.HECOCHAIN_TESTNET_PROVIDER));
                break;
            case 99:
                web3.setProvider(new Web3.providers.HttpProvider(APP_CONSTANTS.MOONRIVER_MAINNET_PROVIDER));
                break;
            case 36:
                web3.setProvider(new Web3.providers.HttpProvider(APP_CONSTANTS.HECOCHAIN_TESTNET_PROVIDER));
                break;

        }
    };

    this.setProvider = function(providerName, network) {

        switch (network) {
            case 1:
                network = isProduction ? network : 2;
                break;
            case 22:
                network = isProduction ? network : 23;
                break;
            case 24:
                network = isProduction ? network : 25;
                break;
            case 35:
                network = 35;
                break;
            case 28:
                network = isProduction ? network : 36;
                break;
            case 99:
                network = 99;
                break;
        }

        switch (providerName) {
            case 'metamask':
                if (window['ethereum'] && window['ethereum'].isMetaMask) {
                    var networkVersion = Number(window['ethereum'].networkVersion);
                    if (
                        ((networkVersion == 31) && (network == 4)) ||
                        ((networkVersion == 30) && (network == 3)) ||
                        ((networkVersion == 1) && (network == 1)) ||
                        ((networkVersion == 3) && (network == 2)) ||
                        ((networkVersion == 97) && (network == 23)) ||
                        ((networkVersion == 56) && (network == 22)) ||
                        ((networkVersion == 80001) && (network == 25)) ||
                        ((networkVersion == 137) && (network == 24)) ||
                        ((networkVersion === 50) && (network === 35)) ||
                        ((networkVersion == 128) && (network == 28)) ||
                        ((networkVersion == 256) && (network == 36)) ||
                        ((networkVersion == 1285) && (network == 99))
                    ) {
                        currentProvider = web3Providers[providerName];
                        web3.setProvider(currentProvider);
                    }
                }
                break;
            default:
                currentProvider = web3Providers[providerName];
                web3.setProvider(currentProvider);
        }
    };

    var checkMetamaskNetwork = function(network) {
        if (window['ethereum'] && window['ethereum'].isMetaMask) {
            var networkVersion = parseInt(window['ethereum'].networkVersion, 10);
            return ((networkVersion === 1) && (network === 1)) ||
                ((networkVersion === 3) && (network === 2)) ||
                ((networkVersion === 97) && (network === 23)) ||
                ((networkVersion === 56) && (network === 22)) ||
                ((networkVersion === 80001) && (network === 25)) ||
                ((networkVersion === 137) && (network === 24)) ||
                ((networkVersion === 50) && (network === 35)) ||
                ((networkVersion == 128) && (network == 28)) ||
                ((networkVersion == 256) && (network == 36)) ||
                ((networkVersion == 1285) && (network == 99));
        } else {
            return false;
        }
    };

    var getMetamaskAccounts = function(providerName, network, callback) {
        if (window['ethereum'] && window['ethereum'].isMetaMask) {
            if (!checkMetamaskNetwork(network)) {
                callback([]);
                return;
            }
            // window['ethereum'].on('accountsChanged', (accounts) => {
            //     observer.next({
            //         type: providerName,
            //         addresses: accounts
            //     });
            // });
            window['ethereum'].enable().then(function(accounts) {
                callback(accounts.map(function(wallet) {
                    return {
                        type: providerName,
                        wallet: wallet
                    }
                }));
            }, function() {
                callback([]);
            });
        } else {
            callback([]);
        }
    };

    var getAccounts = function(providerName, network) {
        var defer = $q.defer();
        _this.setProvider(providerName, network);

        if (providerName === 'metamask') {
            $timeout(function() {
                getMetamaskAccounts(providerName, network, defer.resolve);
            });

            return defer.promise;
        }

        try {
            web3.eth.getAccounts(function(err, addresses) {
                if (!addresses) {
                    defer.resolve([]);
                    return;
                }
                var accountsList = [];
                addresses.map(function(wallet) {
                    var walletModel = {
                        type: providerName,
                        wallet: wallet
                    };
                    accountsList.push(walletModel);
                });
                defer.resolve(accountsList);
            });
        } catch(err) {
            $timeout(function() {
                defer.resolve([]);
            });
        }

        return defer.promise;
    };

    var accountsList;
    this.getAccounts = function(network) {
        accountsList = [];
        var defer = $q.defer();
        var countProviders = 0;

        switch (network) {
            case 1:
                network = isProduction ? network : 2;
                break;
            case 22:
                network = isProduction ? network : 23;
                break;
            case 24:
                network = isProduction ? network : 25;
                break;
            case 35:
                network = 35;
                break;
            case 28:
                network = isProduction ? network : 36;
                break;
            case 99:
                network = 99;
                break;
        }

        for (var clientName in web3Providers) {
            countProviders++;
            getAccounts(clientName, network).then(function(result) {
                countProviders--;
                accountsList = accountsList.concat(result);
                if (!countProviders) {
                    defer.resolve(accountsList);
                }
            }, function() {
                countProviders--;
                if (!countProviders) {
                    defer.resolve(accountsList);
                }
            });
        }
        return defer.promise;
    };

    this.getBalance = function(address) {
        var defer = $q.defer();
        web3.eth.getBalance(Web3.utils.toChecksumAddress(address)).then(defer.resolve, defer.resolve);
        return defer.promise;
    };

    this.web3 = function() {
        return web3;
    };

    this.callMethod = function(contract, method) {
        var defer = $q.defer();

        contract.methods[method] ? contract.methods[method]().call(function(error, result) {
            if (!error) {
                defer.resolve(result);
            } else {
                defer.reject(error);
            }
        }) : $timeout(function() {
            defer.reject('Method not defined');
        });
        return defer.promise;
    };

    var _this = this;



    this.getEthTokensForAddress = function(address, network) {
        var params = {
            path: API.GET_ETH_TOKENS_FOR_ADDRESS,
            query: {
                address: address,
                network: ((network === 1 || network === 22 || network === 24 || network === 35 || network === 28 || network === 99) && isProduction) ? 'mainnet' : 'testnet'
            }
        };
        return requestService.get(params);

    };

    this.getTokenInfo = function(network, token, wallet, customFields) {
        var defer = $q.defer();
        var tokenInfoFields = customFields || ['decimals', 'symbol', 'balanceOf'];
        var requestsCount = 0;
        var tokenInfo = {};

        this.setProviderByNumber(network);
        var web3Contract = this.createContractFromAbi(token, window.abi);

        var getTokenParamCallback = function(result, method) {
            requestsCount--;
            tokenInfo[method] = result;
            if (!requestsCount) {
                if (wallet && tokenInfo['balanceOf']) {
                    var decimalsValue = tokenInfo.decimals ? Math.pow(10, tokenInfo.decimals) : 1;
                    tokenInfo.balance = new BigNumber(tokenInfo.balanceOf).div(decimalsValue).round(2).toString(10);
                }
                defer.resolve(tokenInfo);
            }
        };

        tokenInfoFields.map(function(method) {
            switch (method) {
                case 'balanceOf':
                    if (wallet) {
                        requestsCount++;
                        _this.setProviderByNumber(network);
                        web3Contract.methods[method](wallet).call(function(err, result) {
                            getTokenParamCallback(result, method);
                        });
                    }
                    break;
                default:
                    requestsCount++;
                    _this.setProviderByNumber(network);
                    web3Contract.methods[method]().call(function(err, result) {
                        getTokenParamCallback(result, method);
                    });
            }
        });

        return defer.promise;
    };
});
