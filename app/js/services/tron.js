angular.module('Services').service('TronService', function(TRON_NETWORKS_CONSTANTS, $q, $timeout, $http, requestService) {


    var service = {};

    var isProduction = location.protocol === "https:";


    var connectToMainNet = function() {
        return new TronWeb(
            TRON_NETWORKS_CONSTANTS.MAINNET.FULL_NODE,
            TRON_NETWORKS_CONSTANTS.MAINNET.SOLIDITY_NODE,
            TRON_NETWORKS_CONSTANTS.MAINNET.EVENT_SERVER,
            'd6814d99156f78ea09b729f6ff2f01509fc80f29cdb2ecdeff59a81ca82b7477'
        );
    };

    var connectToTestNet = function() {
        return new TronWeb(
            TRON_NETWORKS_CONSTANTS.TESTNET.FULL_NODE,
            TRON_NETWORKS_CONSTANTS.TESTNET.SOLIDITY_NODE,
            TRON_NETWORKS_CONSTANTS.TESTNET.EVENT_SERVER,
            'd6814d99156f78ea09b729f6ff2f01509fc80f29cdb2ecdeff59a81ca82b7477'
        );
    };

    var connectToNode = function(networkNumber) {
        var node;
        switch (networkNumber) {
            case 14:
                node = isProduction ? connectToMainNet() : connectToTestNet();
                break;
            case 15:
                node = connectToTestNet();
                break;
        }
        return node;
    };


    var getNodes = function(networkNumber) {
        var node;
        switch (networkNumber) {
            case 14:
                return isProduction ? TRON_NETWORKS_CONSTANTS.MAINNET : TRON_NETWORKS_CONSTANTS.TESTNET;
            case 15:
                return TRON_NETWORKS_CONSTANTS.TESTNET;
        }
    };



    service.connectToNetwork = function(networkNumber, ignoreExtension) {
        var defer = $q.defer();
        var currNode = connectToNode(networkNumber);

        if (!(window.tronWeb && window.tronWeb.defaultAddress.hex) || ignoreExtension) {
            $timeout(function() {
                defer.resolve({
                    tronWeb: currNode
                });
            });
            return  defer.promise;
        }

        currNode.trx.getBlock(0).then(function(blockInfo) {
            window.tronWeb.trx.getBlock(0).then(function(blockExtInfo) {
                if (blockInfo.blockID === blockExtInfo.blockID) {
                    defer.resolve({
                        tronWeb: window.tronWeb
                    });
                } else {
                    defer.resolve({
                        tronWeb: currNode
                    });
                }
            })
        });
        return defer.promise;
    };


    service.callContract = function(contractModel, networkNumber) {
        return service.createContract(contractModel.abi.entrys, contractModel.contract_address, networkNumber);
    };

    service.checkToken = function(contractModel, networkNumber, balanceAddress) {

        var tokenInfo = {
            propertiesLength: 0
        };
        var tokenProperties = ['decimals', 'symbol'];
        var defer = $q.defer();
        var currNode = connectToNode(networkNumber);

        var contract = currNode.contract(contractModel.abi.entrys, contractModel.contract_address);

        tokenProperties.map(function(property) {
            contract[property]().call().then(function(result) {
                tokenInfo[property] = result;
                tokenInfo['propertiesLength']++;
                if (tokenInfo['propertiesLength'] === tokenProperties.length) {
                    if (balanceAddress) {
                        contract.balanceOf(balanceAddress).call().then(function(result) {
                            tokenInfo.balance = new BigNumber(result.balance).div(Math.pow(10, tokenInfo['decimals'])).toString(10);
                            defer.resolve(tokenInfo);
                        });
                    } else {
                        defer.resolve(tokenInfo);
                    }
                }
            }, defer.reject);
        });


        return defer.promise;
    };


    service.getAccount = function(address, network) {
        var defer = $q.defer();

        service.connectToNetwork(network, true).then(function(result) {
            result.tronWeb.trx.getAccount(address, function(error, result) {
                defer.resolve({
                    error: error,
                    result: result
                });
            });
        }, function() {
            console.log(arguments);
        });
        return defer.promise;
    };


    service.getAccountAdvancedInfo = function(address, network) {
        var nodes = getNodes(network);
        if (nodes === TRON_NETWORKS_CONSTANTS.TESTNET) {
            var defer = $q.defer();
            requestService.get({
                path: 'get_testnet_tron_tokens/'
            }).then(function(result) {
                defer.resolve({
                    data: {
                        trc20token_balances: result.data.map(function (token) {
                            return {
                                contract_address: token.address,
                                name: token.token_name,
                                decimals: token.decimals,
                                symbol: token.token_short_name,
                                balance: 'Not avaible in Testnet'
                            };
                        })
                    }
                });
               console.log(result.data);
            });
            return defer.promise;
        } else {
            return $http.get(nodes.API + '/api/account?address=' + address);
        }
    };

    service.getContract = function(address, network) {
        var defer = $q.defer();
        if (network) {
            service.connectToNetwork(network, true).then(function(result) {
                result.tronWeb.trx.getContract(address, function(error, result) {
                    defer.resolve(result);
                });
            }, function() {
                console.log(arguments);
            });
            return defer.promise;
        }
        $timeout(function() {
            window.tronWeb.trx.getContract(address, function(result) {
                console.log(result);
                defer.resolve();
            });
        });

        return defer.promise;
    };

    service.createContract = function(abi, address, network) {
        var defer = $q.defer();
        if (network) {
            service.connectToNetwork(network).then(function(result) {
                defer.resolve(result.tronWeb.contract(abi, address));
            }, function() {
                console.log(arguments);
            });
            return defer.promise;
        }
        $timeout(function() {
            defer.resolve(window.tronWeb.contract(abi, address));
        });

        return defer.promise;
    };


    return service;

});
