var module = angular.module('Services');
module.service('EOSService', function($q) {

    var EOSNetworks = {
        'MAINNET': 'https://api.eosio.cr:443',
        'TESTNET': 'https://jungle.eosio.cr:443'
    };

    var eos;
    var isProduction = location.host.indexOf('eos.mywish.io') > -1;

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
        eos = Eos({
            httpEndpoint: EOSNetworks[networkName],
            verbose: false
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
        eos.getAccount(address, function (error, response) {
            if (error) {
                defer.reject(error);
            } else {
                defer.resolve(response);
            }
        });
        return defer.promise;
    };

    this.coinInfo = function(name, short_name) {
        var defer = $q.defer();
        eos.getCurrencyStats(name, short_name, function (error, response) {
            if (error) {
                defer.reject(error);
            } else {
                defer.resolve(response);
            }
        });
        return defer.promise;
    };

    this.getBalance = function(code, account, symbol) {
        var defer = $q.defer();
        eos.getCurrencyBalance(code, account, symbol, function (error, response) {
            if (error) {
                defer.reject(error);
            } else {
                defer.resolve(response);
            }
        });
        return defer.promise;
    };

});