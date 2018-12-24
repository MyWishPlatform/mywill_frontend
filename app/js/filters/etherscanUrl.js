angular.module('Filters').filter('etherscanUrl', function(APP_CONSTANTS) {
    return function(network, path) {
        network = network * 1;
        var addressPaths = {}, networkUrl;

        switch(network) {
            case 1:
                networkUrl = APP_CONSTANTS.ETHERSCAN_ADDRESS;
                addressPaths.address = 'address';
                addressPaths.token = 'token';
                addressPaths.tx = 'tx';
                break;
            case 2:
                networkUrl = APP_CONSTANTS.ROPSTEN_ETHERSCAN_ADDRESS;
                addressPaths.address = 'address';
                addressPaths.token = 'token';
                addressPaths.tx = 'tx';
                break;
            case 3:
                networkUrl = APP_CONSTANTS.RSK_ADDRESS;
                addressPaths.address = 'addr';
                break;
            case 4:
                networkUrl = APP_CONSTANTS.RSK_TESTNET_ADDRESS;
                addressPaths.address = 'addr';
                break;
            case 5:
                networkUrl = APP_CONSTANTS.NEO_MAINNET_ADDRESS;
                addressPaths.address = 'address';
                addressPaths.token = 'address';
                addressPaths.transaction = 'transaction';
                break;
            case 6:
                networkUrl = APP_CONSTANTS.NEO_TESTNET_ADDRESS;
                addressPaths.address = 'address';
                addressPaths.token = 'address';
                addressPaths.transaction = 'transaction';
                break;
            case 10:
                networkUrl = (path !== 'symbol') ? APP_CONSTANTS.EOS_MAINNET_ADDRESS : APP_CONSTANTS.EOS_FLARE_MAINNET_ADDRESS;
                addressPaths.account = 'account';
                addressPaths.token = 'address/info';
                addressPaths.symbol = 'token';
                addressPaths.tx = 'tx';
                break;
            case 11:
                networkUrl = (path !== 'symbol') ? APP_CONSTANTS.EOS_TESTNET_ADDRESS : APP_CONSTANTS.EOS_FLARE_MAINNET_ADDRESS;
                addressPaths.account = 'account';
                addressPaths.token = 'address/info';
                addressPaths.symbol = 'token';
                addressPaths.tx = 'tx';
                break;
            case 12:
                networkUrl = APP_CONSTANTS.TRON_MAINNET_ADDRESS;
                addressPaths.address = '#/address';
                addressPaths.token = '#/contract';
                addressPaths.transaction = '#/transaction';
                break;
            case 13:
                networkUrl = APP_CONSTANTS.TRON_TESTNET_ADDRESS;
                addressPaths.address = '#/address';
                addressPaths.token = '#/contract';
                addressPaths.transaction = '#/transaction';
                break;

        }
        return networkUrl + (addressPaths[path] || '');
    }
});