var module = angular.module('Constants');
module.constant('APP_CONSTANTS', {
    'TEMPLATES': {
        'PATH': '/templates'
    },
    'WISH': {
        'ADDRESS': '0x1b22c32cd936cb97c28c5690a0695a82abf688e6'
    },
    'TEST_ADDRESSES': {
        "ETH": "0xD0593B233Be4411A236F22b42087345E1137170b",
        "EOS": "mywishtestac",
        "TRON": "TRBeBGSyKrVMts1ZQz45JRu9mxCwEhgPSg",
        "NEO": "AYhjNHgTs9sG8B2TbnRT5HxwTA2HAuhthq",
        "RSK": "0xa441b5438885c9b5879e7dfa885b5d1b97216d69"
    },
    'EOS_ADDRESSES': {
        'DEVELOPMENT': {
            'MAINNET': {
                'TOKEN': 'tokenfather2',
                'ACCOUNT': 'mywishtoken4',
                'AIRDROP': 'air.mywishio'
            },
            'TESTNET': {
                'TOKEN': 'tokenfather2',
                'ACCOUNT': 'mywishtoken3',
                'AIRDROP': 'air.mywishio'
            },
            'COMING': 'mywishcoming'
        },
        'PRODUCTION': {
            'MAINNET': {
                'TOKEN': 'tokensfather',
                'ACCOUNT': 'deploymywish',
                'AIRDROP': 'wishairdrops'
            },
            'TESTNET': {
                'TOKEN': 'tokensfather',
                'ACCOUNT': 'mywishiotest',
                'AIRDROP': 'wishairdrops'
            },
            'COMING': 'mywishcoming'
        }
    },
    'INFURA_ADDRESS': "https://mainnet.infura.io/MEDIUMTUTORIAL",
    'ROPSTEN_INFURA_ADDRESS': 'https://ropsten.infura.io/MEDIUMTUTORIAL',

    'ETHERSCAN_ADDRESS': 'https://etherscan.io/',
    'ROPSTEN_ETHERSCAN_ADDRESS': 'https://ropsten.etherscan.io/',

    'RSK_ADDRESS': 'https://explorer.rsk.co/',
    'RSK_TESTNET_ADDRESS': 'https://explorer.testnet.rsk.co/',

    'RSK_NET_ADDRESS': '/endpoint/rsk',
    'RSK_TESTNET_NET_ADDRESS': '/endpoint/rsk-testnet',

    "NEO_TESTNET_ADDRESS": 'http://neoscan.mywish.io/',
    "NEO_MAINNET_ADDRESS": 'http://neoscan.mywish.io/',

    "EOS_MAINNET_ADDRESS": "https://eospark.com/MainNet/",
    "EOS_TESTNET_ADDRESS": "https://eospark.com/Jungle/",

    "TRON_MAINNET_ADDRESS": "https://tronscan.org/",
    "TRON_TESTNET_ADDRESS": "https://shasta.tronscan.org/",

    "EOS_FLARE_MAINNET_ADDRESS": "https://eosflare.io/",

    'EMPTY_PROFILE': {
        "email":"",
        "username":"",
        "contracts":0,
        "is_ghost":true,
        "balance":"0",
        "eos_balance":"0",
        "visibleBalance":"0",
        "internal_btc_address":null,
        "use_totp":false,
        "internal_address":null
    },

    // For production
    'SOCIAL_APP_ID': {
        'GOOGLE': '448526667030-rfiiqfee3f0eils8nha266n43kp1pbac.apps.googleusercontent.com',
        'FACEBOOK': '438113386623173'
    },

    // For test
    // 'SOCIAL_APP_ID': {
    //     'GOOGLE': '364466470795-a5hkjeu1j743r7ado7u9lo7s89rc4r7q.apps.googleusercontent.com',
    //     'FACEBOOK': '392887687850892'
    // },
    'PROMO_CODES': {
        'MEETONE': 'MEETONE',
        'EOSPARK': 'EOSPARK',
        'LYNX': 'LYNX'
    }
});

