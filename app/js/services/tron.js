angular.module('Services').service('TronService', function(TRON_NETWORKS_CONSTANTS, $q, $timeout) {


    var service = {};

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
            case 12:
                node = connectToMainNet();
                break;
            case 13:
                node = connectToTestNet();
                break;
        }
        return node;
    };

    service.connectToNetwork = function(networkNumber) {
        var defer = $q.defer();
        var currNode = connectToNode(networkNumber);

        if (!window.tronWeb) {
            defer.resolve({
                tronWeb: currNode
            });
            return;
        }

        currNode.trx.getBlock(0).then(function(blockInfo) {
            window.tronWeb.trx.getBlock(0).then(function(blockExtInfo) {
                if (blockInfo.blockId === blockExtInfo.blockId) {
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

    service.createContract = function(abi, address, network) {
        if (network) {
            var node = connectToNode(network);
            return node.contract(abi, address)
        }
        return window.tronWeb.contract(abi, address);
    };


    return service;

});
