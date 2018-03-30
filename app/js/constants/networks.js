var module = angular.module('Constants');
module.constant('NETWORKS_TYPES_CONSTANTS', {
    'ETHEREUM_MAINNET': 1,
    'ETHEREUM_ROPSTEN': 2
}).constant('NETWORKS_TYPES_NAMES_CONSTANTS', {
    1: 'Main Ethereum Network',
    2: 'Ropsten Test Net'
});
