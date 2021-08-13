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
                addressPaths.token = 'tokens/nep17';
                addressPaths.transaction = 'transaction';
                break;
            case 10:
                networkUrl = (path !== 'symbol') ? APP_CONSTANTS.EOS_MAINNET_ADDRESS : APP_CONSTANTS.EOS_FLARE_MAINNET_ADDRESS;
                addressPaths.account = 'account';
                addressPaths.token = 'address/info';
                addressPaths.symbol = 'token';
                addressPaths.tx = 'transaction';
                break;
            case 11:
                networkUrl = (path !== 'symbol') ? APP_CONSTANTS.EOS_TESTNET_ADDRESS : APP_CONSTANTS.EOS_FLARE_MAINNET_ADDRESS;
                addressPaths.account = 'account';
                addressPaths.token = 'address/info';
                addressPaths.symbol = 'token';
                addressPaths.tx = 'transaction';
                break;
            case 14:
                networkUrl = APP_CONSTANTS.TRON_MAINNET_ADDRESS;
                addressPaths.address = '#/address';
                addressPaths.token = '#/contract';
                addressPaths.tx = '#/transaction';
                addressPaths.token20 = '#/contract';
                break;
            case 15:
                networkUrl = APP_CONSTANTS.TRON_TESTNET_ADDRESS;
                addressPaths.address = '#/address';
                addressPaths.token = '#/contract';
                addressPaths.tx = '#/transaction';
                addressPaths.token20 = '#/contract';
                break;
            case 22:
                networkUrl = APP_CONSTANTS.BNB_MAINNET_ADDRESS;
                addressPaths.address = '/address';
                addressPaths.token = '/address';
                addressPaths.tx = '/tx';
                addressPaths.token20 = '/address';
                break;
            case 23:
                networkUrl = APP_CONSTANTS.BNB_TESTNET_ADDRESS;
                addressPaths.address = '/address';
                addressPaths.token = '/address';
                addressPaths.tx = '/tx';
                addressPaths.token20 = '/address';
                break;
            case 24:
                networkUrl = APP_CONSTANTS.MATIC_MAINNET_ADDRESS;
                addressPaths.address = '/address';
                addressPaths.token = '/address';
                addressPaths.tx = '/tx';
                addressPaths.token20 = '/address';
                break;
            case 25:
                networkUrl = APP_CONSTANTS.MATIC_TESTNET_ADDRESS;
                addressPaths.address = '/address';
                addressPaths.token = '/address';
                addressPaths.tx = '/tx';
                addressPaths.token20 = '/address';
                break;
            case 28:
                networkUrl = APP_CONSTANTS.HECOCHAIN_MAINNET_ADDRESS;
                addressPaths.address = '/address';
                addressPaths.token = '/address';
                addressPaths.tx = '/tx';
                addressPaths.token20 = '/address';
                break;
            case 35:
                networkUrl = APP_CONSTANTS.XINFIN_MAINNET_ADDRESS;
                addressPaths.address = '/addr';
                addressPaths.token = '/addr';
                addressPaths.tx = '/tx';
                addressPaths.token20 = '/addr';
                break;
            case 36:
                networkUrl = APP_CONSTANTS.HECOCHAIN_TESTNET_ADDRESS;
                addressPaths.address = '/address';
                addressPaths.token = '/address';
                addressPaths.tx = '/tx';
                addressPaths.token20 = '/address';
                break;

        }
        return networkUrl + (addressPaths[path] || '');
    }
});
