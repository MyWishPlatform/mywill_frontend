var module = angular.module('Services');
module.service('EOSService', function($q, EOS_NETWORKS_CONSTANTS) {

    var EOSNetworks = {
        'MAINNET': [],
        'TESTNET': []
    };

    EOS_NETWORKS_CONSTANTS.map(function(networkType) {
        networkType.endpoints.map(function(networkItem) {
            networkItem.chainId = networkType.chainId;
            EOSNetworks[networkType.name].push({
                url: networkItem.protocol + '://' + networkItem.url + ':' + networkItem.port,
                params: networkItem
            });
        });
    });

    var eos;
    var isProduction = (location.host.indexOf('eos.mywish.io') > -1) || (location.host.indexOf('contracts.mywish.io') > -1);
    var _this = this;


    var eosAccounts = {
        'MAINNET': {
            'TOKEN': isProduction ? 'deploymywish' : 'mywishtoken4',
            'ACCOUNT': isProduction ? 'deploymywish' : 'mywishtoken4'
        },
        'TESTNET': {
            'TOKEN': isProduction ? 'deploymywish' : 'mywishtoken3',
            'ACCOUNT': isProduction ? 'deploymywish' : 'mywishtoken3'
        }
    };


    this.getMywishAddress = function(network) {
        switch (network) {
            case 11:
                return isProduction ? 'deploymywish' : 'mywishtoken3';
                break;
            case 10:
                return isProduction ? 'deploymywish' : 'mywishtoken4';
                break;
        }
    };

    var currentNetworks = {
        'MAINNET': 0,
        'TESTNET': 0
    };

    var currentNetwork, currentNetworkName, currentEndPoint;

    this.createEosChain = function(network, callback) {
        network = isProduction ? network * 1 : 11;
        switch(network) {
            case 10:
                currentNetworkName = 'MAINNET';
                break;
            case 11:
                currentNetworkName = 'TESTNET';
                break;
        }
        currentNetwork = network;
        currentEndPoint = EOSNetworks[currentNetworkName][currentNetworks[currentNetworkName]]['params'];
        eos = Eos({
            httpEndpoint: EOSNetworks[currentNetworkName][currentNetworks[currentNetworkName]]['url'],
            verbose: false
        });
        checkNetwork(callback);
    };

    var checkNetwork = function(callback) {
        _this.getInfo().then(callback, function(error) {
            currentNetworks[currentNetworkName]++;
            currentNetworks[currentNetworkName] = (currentNetworks[currentNetworkName] > (EOSNetworks[currentNetworkName].length - 1)) ? 0 : currentNetworks[currentNetworkName];
            _this.createEosChain(currentNetwork, callback);
        });
    };

    this.getInfo = function() {
        var defer = $q.defer();
        eos.getInfo(function(error, response) {
            if (error) {
                defer.reject(error);
            } else {
                defer.resolve(response);

                var requiredFields = {
                    accounts: [
                        {
                            blockchain: 'eos',
                            chainId: currentEndPoint.chainId,
                            host: currentEndPoint.url,
                            port: currentEndPoint.port,
                            protocol: currentEndPoint.protocol
                        }
                    ]
                };

                // setTimeout(function() {
                    // eos.contract('eosio.token').then(console.log);
                    // eos.contract('mywishtoken3').then(console.log);
                    // _this.coinInfo('mywishtoken3', 'DT').then(console.log);

                    // scatter.getIdentity(requiredFields).then(function(identity) {
                    //     scatter.authenticate().then(function (sign) {
                    //         var eos = scatter.eos(requiredFields.accounts[0], Eos, {});
                    //         eos.transaction({
                    //             actions: [
                    //                 {
                    //                     account: 'mywishtoken3',
                    //                     name: 'issue',
                    //                     authorization: [{
                    //                         actor: 'dimankovalev',
                    //                         permission: 'active'
                    //                     }],
                    //                     data: {
                    //                         from: 'dimankovalev',
                    //                         to: 'dimankovalev',
                    //                         quantity: '7000 DT',
                    //                         memo: ''
                    //                     }
                    //                 }
                    //             ],
                    //             "signatures": [sign]
                    //         }).then(console.log);
                    //     });
                    // });
                // }, 2000);
            }
        });
        return defer.promise;
    };

    this.checkAddress = function(address) {
        var defer = $q.defer();
        checkNetwork(function() {
            eos.getAccount(address, function (error, response) {
                if (error) {
                    defer.reject(error);
                } else {
                    defer.resolve(response);
                }
            });
        });
        return defer.promise;
    };

    this.coinInfo = function(short_name) {
        var defer = $q.defer();
        checkNetwork(function() {
            eos.getCurrencyStats(eosAccounts[currentNetworkName]['TOKEN'], short_name, function (error, response) {
                if (error) {
                    defer.reject(error);
                } else {
                    defer.resolve(response);
                }
            });
        });
        return defer.promise;
    };

    this.getBalance = function(code, account, symbol) {
        var defer = $q.defer();
        checkNetwork(function() {
            eos.getCurrencyBalance(code, account, symbol, function (error, response) {
                if (error) {
                    defer.reject(error);
                } else {
                    defer.resolve(response);
                }
            });
        });
        return defer.promise;
    };

    var scatter;
    document.addEventListener('scatterLoaded', function() {
        scatter = window.scatter;
    });


});

