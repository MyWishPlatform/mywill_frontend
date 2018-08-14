var module = angular.module('Services');
module.service('EOSService', function($q, EOS_NETWORKS_CONSTANTS) {

    var EOSNetworks = {
        'MAINNET': [],
        'TESTNET': []
    };

    EOS_NETWORKS_CONSTANTS.map(function(networkType) {
        networkType.endpoints.map(function(networkItem) {
            EOSNetworks[networkType.name].push(networkItem.protocol + '://' + networkItem.url + ':' + networkItem.port);
        });
    });

    var eos;
    var isProduction = (location.host.indexOf('eos.mywish.io') > -1) || (location.host.indexOf('contracts.mywish.io') > -1);
    var _this = this;

    this.getMywishAddress = function(network) {
        switch (network) {
            case 11:
                return isProduction ? 'mywishprod1' : 'mywishtoken3';
                break;
            case 10:
                return isProduction ? 'mywishprod1' : 'mywishtoken4';
                break;
        }
    };

    var currentNetworks = {
        'MAINNET': 0,
        'TESTNET': 0
    };

    var currentNetwork, currentNetworkName;

    this.createEosChain = function(network) {
        network = isProduction ? network * 1 : 11;
        var networkName;
        switch(network) {
            case 10:
                networkName = 'MAINNET';
                break;
            case 11:
                networkName = 'TESTNET';
                break;
        }

        currentNetwork = network;
        currentNetworkName = networkName;

        eos = Eos({
            httpEndpoint: EOSNetworks[networkName][currentNetworks[networkName]],
            verbose: false
        });
        checkNetwork();
    };

    var checkNetwork = function(callback) {
        _this.getInfo().then(callback, function(error) {
            currentNetworks[currentNetworkName]++;
            currentNetworks[currentNetworkName] = (currentNetworks[currentNetworkName] > (EOSNetworks[currentNetworkName].length - 1)) ? 0 : currentNetworks[currentNetworkName];
            _this.createEosChain(currentNetwork);
        });
    };

    this.getInfo = function() {
        var defer = $q.defer();
        eos.getInfo(function(error, response) {
            if (error) {
                defer.reject(error);
            } else {
                defer.resolve(response);
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

    this.coinInfo = function(name, short_name) {
        var defer = $q.defer();
        checkNetwork(function() {
            eos.getCurrencyStats(name, short_name, function (error, response) {
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

});