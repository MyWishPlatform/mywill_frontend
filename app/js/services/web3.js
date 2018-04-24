angular.module('Services').service('web3Service', function($q, $rootScope, APP_CONSTANTS) {

    var web3 = new Web3(), contract, _this = this;

    /* Определение провайдеров клиентов */
    var web3Providers = {};
    var createWeb3Providers = function() {
        var metamask, parity, infura;
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
        contract.options.address = contractAddress;
        return contract;
    };

    var currentProvider;

    this.setProviderByNumber = function(networkId) {
        networkId = networkId * 1;
        switch (networkId) {
            case 1:
                web3.setProvider(new Web3.providers.HttpProvider(APP_CONSTANTS.INFURA_ADDRESS));
                break;
            case 2:
                web3.setProvider(new Web3.providers.HttpProvider(APP_CONSTANTS.ROPSTEN_INFURA_ADDRESS));
                break;
            case 3:
                web3.setProvider(new Web3.providers.HttpProvider(APP_CONSTANTS.RSK_NET_ADDRESS));
                break;
            case 4:
                web3.setProvider(new Web3.providers.HttpProvider(APP_CONSTANTS.RSK_TESTNET_NET_ADDRESS));
                break;
        }
    };

    this.setProvider = function(providerName, network) {
        switch (providerName) {
            case 'metamask':
                var networkVersion = web3Providers['metamask'].publicConfigStore._state.networkVersion;
                if (
                    ((networkVersion == 31) && (network == 4)) ||
                    ((networkVersion == 30) && (network == 3)) ||
                    ((networkVersion == 1) && (network == 1)) ||
                    ((networkVersion == 3) && (network == 2))
                ) {
                    currentProvider = web3Providers[providerName];
                    web3.setProvider(currentProvider);
                }
                break;
            default:
                currentProvider = web3Providers[providerName];
                web3.setProvider(currentProvider);
        }
    };


    var getAccounts = function(providerName, network) {
        var defer = $q.defer();
        _this.setProvider(providerName, network);
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
        return defer.promise;
    };

    var accountsList;
    this.getAccounts = function(network) {
        accountsList = [];
        var defer = $q.defer();
        var countProviders = 0;
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

});
