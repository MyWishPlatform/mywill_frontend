var module = angular.module('Services');
module.service('EOSService', function($q) {

    var EOSNetworks = {
        'MAINNET': 'https://api.eosio.cr:443',
        'TESTNET': 'https://jungle.eosio.cr:443'
    };

    var eos;
    this.createEosChain = function(network) {
        network = network * 1;
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

});