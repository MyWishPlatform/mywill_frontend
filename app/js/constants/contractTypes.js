var module = angular.module('Constants');
module.constant('CONTRACT_TYPES_CONSTANTS', {
    'LAST_WILL': 0,
    'LOST_KEY': 1,
    'DEFERRED': 2,
    'SHOPPING': 3,
    'CROWD_SALE': 4,
    'TOKEN': 5,
    'TOKEN_NEO': 6,
    'CROWDSALE_NEO': 7,
    'AIRDROP': 8,
    'INVESTMENT_PULL': 9
}).constant('CONTRACT_TYPES_NAMES_CONSTANTS', {
    0: 'lastWill',
    1: 'lostKey',
    2: 'deferred',
    3: 'shopping',
    4: 'crowdSale',
    5: 'token',
    6: 'token',
    7: 'crowdSale',
    8: 'airdrop',
    9: 'investmentPull'
});
