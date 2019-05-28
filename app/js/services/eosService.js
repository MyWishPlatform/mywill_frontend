var module = angular.module('Services');
module.service('EOSService', function($q, EOS_NETWORKS_CONSTANTS, APP_CONSTANTS, $http, $timeout) {

    var scatter;

    ScatterJS.scatter.connect("MyWish platform 2").then(function(connected) {
        // User does not have Scatter Desktop, Mobile or Classic installed.
        if(!connected) return false;
        ScatterJS.plugins( new ScatterEOS() );
        scatter = ScatterJS.scatter;
        // -----------------------
        // ^^^ See the section below about storing this in state.
        // -----------------------
        window.ScatterJS = null;
        // -----------------------
        // ^^^ See the section below about nulling out the window reference
        // -----------------------
    });

    var chainCallbacks, chainChecked;

    var EOSNetworks = {
        'MAINNET': [],
        'TESTNET': []
    };

    EOS_NETWORKS_CONSTANTS.map(function(networkType) {
        networkType.endpoints.map(function(networkItem) {
            networkItem.chainId = networkType.chainId;
            EOSNetworks[networkType.name].push({
                url: networkItem.protocol + '://' + networkItem.url + (networkItem.port ? ':' + networkItem.port : ''),
                params: networkItem
            });
        });
    });

    var eos;

    var isProduction = location.protocol === "https:";

    var _this = this;

    var eosAccounts = APP_CONSTANTS.EOS_ADDRESSES[isProduction ? 'PRODUCTION' : 'DEVELOPMENT'];

    this.getComingAddress = function() {
        return eosAccounts['COMING'];
    };

    this.getAirdropAddress = function(network) {
        network*= 1;
        var displayingNetwork;
        switch(network) {
            case 10:
                displayingNetwork = 'MAINNET';
                break;
            case 11:
                displayingNetwork = 'TESTNET';
                break;
        }
        return eosAccounts[displayingNetwork]['AIRDROP'];
    };

    var currentNetworks = {
        'MAINNET': 0,
        'TESTNET': 0
    };

    var currentNetwork, currentNetworkName, currentEndPoint, displayingNetwork;

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
        network*= 1;
        connectToNetwork(network).then(function() {eos.getAccount(address, function (error, response) {
            if (error) {
                defer.reject(error);
            } else {
                defer.resolve(response);
            }
        });

        });
        return defer.promise;
    };

    this.callCustomMethod = function(method, data, network) {
        var defer = $q.defer();
        connectToNetwork(network).then(function() {
            $http({
                method: 'post',
                url: 'https://' + currentEndPoint.url + '/v1/chain-ext/' + method,
                data: data
            }).then(function(response) {
                defer.resolve(response);
            }, defer.reject)
        });
        return defer.promise;
    };



    var networkConnectionModel;

    var networkConnection = function(network) {
        network = network * 1;

        if (networkConnectionModel) {
            if (networkConnectionModel.network === network) {
                switch (networkConnectionModel.state) {
                    case 'pending':
                    case 'check':
                        return networkConnectionModel.promise;
                    case 'connected':
                        return networkConnectionModel.check();
                }
            }
            networkConnectionModel.abort();
        }

        this.network = network;
        networkConnectionModel = this;

        var state = 'pending';

        this.abort = function() {
            state = 'aborted';
            this.promise.reject();
        };

        var defer = $q.defer();
        this.promise = defer.promise;

        switch(network) {
            case 10:
                displayingNetwork = 'MAINNET';
                currentNetworkName = isProduction ? 'MAINNET' : 'TESTNET';
                // currentNetworkName = 'MAINNET';
                break;
            case 11:
                displayingNetwork = 'TESTNET';
                currentNetworkName = 'TESTNET';
                break;
        }

        currentNetwork = network;

        var reconnect = function() {
            currentEndPoint = EOSNetworks[currentNetworkName][currentNetworks[currentNetworkName]]['params'];
            eos = Eos({
                httpEndpoint: EOSNetworks[currentNetworkName][currentNetworks[currentNetworkName]]['url'],
                verbose: false
            });
            getInfo();
        };


        var getInfo = function() {
            state = 'check';
            return _this.getInfo().then(function(result) {
                if (state === 'aborted') {
                    return;
                }
                state = 'connected';
                return result;
            }, function() {
                currentNetworks[currentNetworkName]++;
                currentNetworks[currentNetworkName] = (currentNetworks[currentNetworkName] > (EOSNetworks[currentNetworkName].length - 1)) ? 0 : currentNetworks[currentNetworkName];
                if (state === 'aborted') {
                    return;
                }
                reconnect();
            });
        };

        reconnect();

        this.check = getInfo;
    };

    this.createEosChain = networkConnection;

    var connectToNetwork = function(network) {
        network = network || (networkConnectionModel ? networkConnectionModel.network : 10);
        if (!(networkConnectionModel && (networkConnectionModel.network === network))) {
            new networkConnection(network);
        }
        return networkConnectionModel.check();
    };


    this.getTableRows = function(scope, table, code, network, key) {
        var defer = $q.defer();
        connectToNetwork(network).then(function(node) {
            var getTableParams = {
                code: code || eosAccounts[displayingNetwork]['TOKEN'],
                scope: scope,
                table: table || 'stat',
                json: true
            };
            if (key) {
                getTableParams.lower_bound =
                    getTableParams.upper_bound = key;
            }
            eos.getTableRows(getTableParams, function (error, response) {
                if (error) {
                    defer.reject(error);
                } else {
                    defer.resolve(response);
                }
            });
        });
        return defer.promise;
    };

    this.coinInfo = function(short_name, network, tokenAddress) {
        var defer = $q.defer();
        connectToNetwork(network).then(function() {
            eos.getCurrencyStats(tokenAddress || eosAccounts[displayingNetwork]['TOKEN'], short_name, function (error, response) {
                if (error) {
                    defer.reject(error);
                } else {
                    defer.resolve(response);
                }
            });
        });

        return defer.promise;
    };

    this.getBalance = function(code, account, symbol, network) {
        var defer = $q.defer();
        connectToNetwork(network).then(function() {
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
        var createTransaction = function(tokenOwnerAccount, signature) {

            var eos = scatter.eos(getNetwork(), Eos, {});

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

        this.connectScatter(false, createTransaction);

        return defer.promise;
    };

    var getNetwork = function() {
        console.log(currentEndPoint);
        return {
            blockchain: 'eos',
            chainId: currentEndPoint.chainId,
            host: currentEndPoint.url,
            port: currentEndPoint.port,
            protocol: currentEndPoint.protocol
        }
    };

    this.mintTokens = function(tokenOwner, tokensTo, tokenSymbol, amount, memo, tokenAccount, network) {
        return _this.sendTx({
            owner: tokenOwner,
            actions: [{
                account: tokenAccount || eosAccounts[displayingNetwork]['TOKEN'],
                name: 'issue',
                data: {
                    from: tokenOwner,
                    to: tokensTo,
                    quantity: amount + ' ' + tokenSymbol,
                    memo: memo || ''
                }
            }]
        }, network);
    };

    this.sendTx = function(params, network) {
        var defer = $q.defer();
        var createTransaction = function(tokenOwnerAccount, signature) {
            if (!tokenOwnerAccount) {
                defer.reject({
                    "code": 1
                });
                return;
            }
            params['actions'].map(function(action) {
                if ((action.name === 'transfer') && !action.data.from) {
                    action.data.from = tokenOwnerAccount['name'];
                }
                action.authorization = [{
                    "actor": tokenOwnerAccount['name'],
                    "permission": tokenOwnerAccount['authority']
                }];
            });
            var eos = scatter.eos(getNetwork(), Eos, {});
            eos.transaction({
                "actions": params.actions,
                "signatures": [signature]
            }).then(defer.resolve).catch(function(error) {
                defer.reject({
                    error: error,
                    code: 2
                });
            });
        };

        connectToNetwork(network).then(function() {
            _this.connectScatter(params['owner'], createTransaction, function(error) {
                defer.reject({
                    error: error
                });
            });
        });

        return defer.promise;
    };

    var checkIdentity = function(success, error) {
        var requiredFields = {
            accounts: [{
                blockchain: 'eos',
                chainId: currentEndPoint.chainId
            }]
        };

        var getIdentity = function() {
            scatter.getIdentity(requiredFields)
                .then(success)
                .catch(error);
        };

        if (scatter.identity) {
            scatter.logout().then(function() {
                getIdentity();
            });
        } else {
            getIdentity();
        }

    };

    this.connectScatter = function(owner, callback, error) {
        checkIdentity(function(identity) {
            var tokenOwnerAccount = owner ? identity.accounts.filter(function(account) {
                return account['name'] === owner;
            })[0] : identity.accounts[0];

            if (owner && !tokenOwnerAccount) {
                error();
                return;
            }

            scatter.authenticate(tokenOwnerAccount ? tokenOwnerAccount.name : false).then(function (sign) {
                callback(tokenOwnerAccount, sign);
            });
        }, error);
    };

    this.checkScatter = function() {
        return scatter;
    };

});