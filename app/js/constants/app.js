var module = angular.module('Constants');
module.constant('APP_CONSTANTS', {
    'TEMPLATES': {
        'PATH': '/templates'
    },
    'WISH': {
        'ADDRESS': '0x1b22c32cd936cb97c28c5690a0695a82abf688e6'
    },
    'INFURA_ADDRESS':

        // For production
        "https://mainnet.infura.io/MEDIUMTUTORIAL",

        // For test
        // "https://ropsten.infura.io/MEDIUMTUTORIAL",
    // 'ETHERSCAN_ADDRESS': 'https://ropsten.etherscan.io/',
    'ETHERSCAN_ADDRESS': 'https://etherscan.io/',
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
    },

    // For production
    'SOCIAL_APP_ID': {
        'GOOGLE': '448526667030-rfiiqfee3f0eils8nha266n43kp1pbac.apps.googleusercontent.com',
        'FACEBOOK': '438113386623173'
    }

    // For test
    // 'SOCIAL_APP_ID': {
    //     'GOOGLE': '364466470795-a5hkjeu1j743r7ado7u9lo7s89rc4r7q.apps.googleusercontent.com',
    //     'FACEBOOK': '392887687850892'
    // }
});

