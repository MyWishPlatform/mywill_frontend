var module = angular.module('Constants');
module.constant('APP_CONSTANTS', {
    'TEMPLATES': {
        'PATH': '/templates'
    },
    'WISH': {
        'ADDRESS': '0x1b22c32cd936cb97c28c5690a0695a82abf688e6'
    },
    'INFURA_ADDRESS':
        "https://mainnet.infura.io/MEDIUMTUTORIAL",
        // "https://ropsten.infura.io/MEDIUMTUTORIAL",
    'EMPTY_PROFILE': {
        "email":"",
        "username":"",
        "contracts":0,
        "is_ghost":true,
        "balance":"0",
        "visibleBalance":"0",
        "internal_btc_address":null,
        "use_totp":false,
        "internal_address":null
    }
});

