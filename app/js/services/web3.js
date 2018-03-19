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
    this.setProvider = function(providerName) {
        currentProvider = web3Providers[providerName];
        web3.setProvider(currentProvider);
    };

    var getAccounts = function(providerName) {
        var defer = $q.defer();
        _this.setProvider(providerName);
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
    this.getAccounts = function() {
        accountsList = [];
        var defer = $q.defer();
        var countProviders = 0;
        for (var clientName in web3Providers) {
            countProviders++;
            getAccounts(clientName).then(function(result) {
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

    this.web3 = function() {
        return web3;
    };

});
