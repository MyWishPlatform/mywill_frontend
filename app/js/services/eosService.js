var module = angular.module('Services');
module.service('EOSService', function($q, EOS_NETWORKS_CONSTANTS, APP_CONSTANTS, $http, $timeout) {

    var scatter;

    if (window.ScatterJS && window.ScatterEOS) {
        window.ScatterJS.plugins( new window.ScatterEOS() );
    }

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
        eos.get_info().then(defer.resolve, defer.reject);
        return defer.promise;
    };

    this.checkAddress = function(address, network) {
        var defer = $q.defer();
        network*= 1;
        connectToNetwork(network).then(function() {
            eos.get_account(address).then(function(response) {
                defer.resolve(response);
            }, function(error) {
                defer.reject({
                    status: error.json.code
                });
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

        this.network = network;

        var state = 'pending';

        this.abort = function() {
            state = 'aborted';
            if (thisPromise) {
                thisPromise.reject();
            }
        };

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

        var reconnect = function() {
            currentEndPoint = EOSNetworks[currentNetworkName][currentNetworks[currentNetworkName]]['params'];
            eos = new Eos.JsonRpc(EOSNetworks[currentNetworkName][currentNetworks[currentNetworkName]]['url']);
            getInfo();
        };


        var thisPromise;

        var getInfo = function() {

            if (state === 'check') {
                return thisPromise.promise;
            }
            state = 'check';
            if (!thisPromise) {
                thisPromise = $q.defer();
            }
            _this.getInfo().then(function(result) {
                if (state === 'aborted') {
                    return;
                }
                state = 'connected';
                thisPromise.resolve(result);
                thisPromise = false;
                return result;
            }, function(err) {
                if (state === 'aborted') {
                    return;
                }
                state = 'error';
                currentNetworks[currentNetworkName]++;
                currentNetworks[currentNetworkName] = (currentNetworks[currentNetworkName] > (EOSNetworks[currentNetworkName].length - 1)) ? 0 : currentNetworks[currentNetworkName];
                reconnect();
            });

            return thisPromise.promise;
        };

        reconnect();

        this.check = getInfo;
    };

    var connectToNetwork = function(network) {
        network = network || (networkConnectionModel ? networkConnectionModel.network : 10);

        if (!(networkConnectionModel && (networkConnectionModel.network === network))) {
            networkConnectionModel = new networkConnection(network);
        }
        return networkConnectionModel.check();
    };


    this.createEosChain = connectToNetwork;



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
            eos.get_table_rows(getTableParams, function (error, response) {
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
        connectToNetwork(network).then(function(result) {
            eos.get_currency_stats(tokenAddress || eosAccounts[displayingNetwork]['TOKEN'], short_name).then(
                defer.resolve, defer.reject);
        });
        return defer.promise;
    };

    this.getBalance = function(code, account, symbol, network) {
        var defer = $q.defer();
        connectToNetwork(network).then(function() {
            eos.get_currency_balance(code, account, symbol).then(defer.resolve, defer.reject);
        });
        return defer.promise;
    };


    this.buyTokens = function(amount, memo, defer) {
        var options = {
            actions: [{
                account: 'eosio.token',
                name: 'transfer',
                data: {
                    to: eosAccounts['COMING'],
                    quantity: amount + ' EOS',
                    memo: memo || ''
                }
            }]
        };
        return this.sendTx(options);
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

        var eosNetwork = ScatterJS.Network.fromJson(getNetwork());
        var rpc = new Eos.JsonRpc(eosNetwork.fullhost());


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
            var eos = ScatterJS.eos(eosNetwork, Eos.Api, {rpc: rpc});
            eos.transact({
                "actions": params.actions
            }, {
                blocksBehind: 3,
                expireSeconds: 30
            }).then(defer.resolve).catch(function(error) {
                defer.reject({
                    error: error,
                    code: 2
                });
            });
        };

        connectToNetwork(network).then(function() {

            ScatterJS.connect("MyWish platform", {network: network}).then(function(connected) {
                if(!connected) return false;
                _this.connectScatter(params['owner'], createTransaction, function(error) {
                    defer.reject({
                        error: error
                    });
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
            ScatterJS.scatter.getIdentity(requiredFields)
                .then(success)
                .catch(error);
        };

        if (ScatterJS.scatter.identity) {
            ScatterJS.scatter.logout().then(function() {
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

            ScatterJS.scatter.authenticate(tokenOwnerAccount ? tokenOwnerAccount.name : false).then(function (sign) {
                callback(tokenOwnerAccount, sign);
            });
        }, error);
    };

    this.checkScatter = function() {
        return !!ScatterJS.scatter;
    };

});