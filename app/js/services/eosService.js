var module = angular.module('Services');
module.service('EOSService', function($q, EOS_NETWORKS_CONSTANTS, APP_CONSTANTS) {

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
    var isProduction = (location.host.indexOf('eos.mywish.io') === 0) || (location.host.indexOf('contracts.mywish.io') > -1);
    var _this = this;

    var eosAccounts = APP_CONSTANTS.EOS_ADDRESSES[isProduction ? 'PRODUCTION' : 'DEVELOPMENT'];

    this.getComingAddress = function() {
        return eosAccounts['COMING'];
    };

    var currentNetworks = {
        'MAINNET': 0,
        'TESTNET': 0
    };

    var currentNetwork, currentNetworkName, currentEndPoint, displayingNetwork;

    this.createEosChain = function(network, callback) {
        switch(network) {
            case 10:
                displayingNetwork = 'MAINNET';
                currentNetworkName = isProduction ? 'MAINNET' : 'TESTNET';
                break;
            case 11:
                displayingNetwork = 'TESTNET';
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
            }
        });
        return defer.promise;
    };

    this.checkAddress = function(address, network) {
        var defer = $q.defer();
        var getAccount = function() {
            eos.getAccount(address, function (error, response) {
                if (error) {
                    defer.reject(error);
                } else {
                    defer.resolve(response);
                }
            });
        };
        network  ? _this.createEosChain(network, getAccount) : checkNetwork(getAccount);

        return defer.promise;
    };

    this.getTableRows = function(scope, table, code, network) {
        var defer = $q.defer();
        network  ? _this.createEosChain(network, function() {
            eos.getTableRows({
                code: code || eosAccounts[displayingNetwork]['TOKEN'],
                scope: scope,
                table: table || 'stat',
                json: true
            }, function (error, response) {
                if (error) {
                    defer.reject(error);
                } else {
                    defer.resolve(response);
                }
            });
        }) : false;
        return defer.promise;
    };

    this.coinInfo = function(short_name) {
        var defer = $q.defer();
        checkNetwork(function() {
            eos.getCurrencyStats(eosAccounts[displayingNetwork]['TOKEN'], short_name, function (error, response) {
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


    this.buyTokens = function(amount, memo, defer) {
        defer = defer || $q.defer();
        window.scatter.authenticate().then(function (sign) {
            window.scatter.forgetIdentity().then(function() {
                _this.buyTokens(amount, memo, defer);
            });
        }).catch(function() {
            _this.connectScatter(createTransaction);
        });

        var createTransaction = function(accounts, signature) {
            var network = {
                blockchain: 'eos',
                chainId: currentEndPoint.chainId,
                host: currentEndPoint.url,
                port: currentEndPoint.port,
                protocol: currentEndPoint.protocol
            };
            var tokenOwnerAccount = accounts[0];

            var eos = window.scatter.eos(network, Eos, {});

            var options = {
                actions: [{
                    account: 'eosio.token',
                    name: 'transfer',
                    authorization: [{
                        actor: tokenOwnerAccount['name'],
                        permission: tokenOwnerAccount['authority']
                    }],
                    data: {
                        from: tokenOwnerAccount['name'],
                        to: eosAccounts['COMING'],
                        quantity: amount + ' EOS',
                        memo: memo || ''
                    }
                }],
                "signatures": [signature]
            };

            eos.transaction(options).then(defer.resolve).catch(function(result) {
                defer.reject({
                    code: 2
                });
            });

        };

        return defer.promise;
    };

    var getNetwork = function() {
        return {
            blockchain: 'eos',
            chainId: currentEndPoint.chainId,
            host: currentEndPoint.url,
            port: currentEndPoint.port,
            protocol: currentEndPoint.protocol
        }
    };

    this.mintTokens = function(tokenOwner, tokensTo, tokenSymbol, amount, memo) {
        return _this.sendTx({
            owner: tokenOwner,
            actions: [{
                account: eosAccounts[displayingNetwork]['TOKEN'],
                name: 'issue',
                data: {
                    from: tokenOwner,
                    to: tokensTo,
                    quantity: amount + ' ' + tokenSymbol,
                    memo: memo || ''
                }
            }]
        });
    };

    this.sendTx = function(params, defer) {
        defer = defer || $q.defer();
        window.scatter.authenticate().then(function() {
            window.scatter.forgetIdentity().then(function() {
                _this.sendTx(params, defer);
            });
        }).catch(function() {
            _this.connectScatter(createTransaction);
        });
        var createTransaction = function(accounts, signature) {
            var tokenOwnerAccount = params['owner'] ? accounts.filter(function(account) {
                return account['name'] === params['owner'];
            })[0] : accounts[0];
            if (!tokenOwnerAccount) {
                defer.reject({
                    "code": 1
                });
                return;
            }
            params['actions'].map(function(action) {
                action.authorization = [{
                    "actor": tokenOwnerAccount['name'],
                    "permission": tokenOwnerAccount['authority']
                }];
            });

            var eos = window.scatter.eos(getNetwork(), Eos, {});

            eos.transaction({
                "actions": params.actions,
                "signatures": [signature]
            }).then(defer.resolve).catch(function() {
                defer.reject({
                    code: 2
                });
            });
        };
        return defer.promise;
    };



    var checkIdentity = function(success, error) {
        var requiredFields = {
            accounts: [{
                blockchain: 'eos',
                chainId: currentEndPoint.chainId
            }]
        };

        window.scatter.getIdentity(requiredFields)
            .then(success)
            .catch(error);
    };

    this.connectScatter = function(callback) {
        checkIdentity(function(identity) {
            window.scatter.authenticate().then(function (sign) {
                callback(identity.accounts, sign);
            });
        });
    };

    this.checkScatter = function() {
        return window.scatter;
    };

});