var module = angular.module('Constants');
module.constant('APP_CONSTANTS', {
    'TEMPLATES': {
        'PATH': '/templates'
    },
    'WISH': {
        'ADDRESS': '0x1b22c32cd936cb97c28c5690a0695a82abf688e6',
        'TEST_ADDRESS': '0xa9CcA3bC3867C8D833682AF3Fec46Ad5bdF1A1b8'
    },
    'RBC': {
        'ADDRESS': '0xa4eed63db85311e22df4473f87ccfc3dadcfa3e3',
        'TEST_ADDRESS': '0x88c37052d55112ac3CfE2b04d2d5663edCc4b2a4'
    },
    'OKB': {
        'ADDRESS': '0x75231f58b43240c9718dd58b4967c5114342a86c',
        // 'ADDRESS': '0x354f43e88a279bd4fb53f32614c9d6300bb0f25a',
        'TEST_ADDRESS': '0x354f43e88a279bd4fb53f32614c9d6300bb0f25a'
    },
    'TEST_ADDRESSES': {
        "ETH": "0xD0593B233Be4411A236F22b42087345E1137170b",
        "EOS": "mywishtestac",
        "TRON": "TRBeBGSyKrVMts1ZQz45JRu9mxCwEhgPSg",
        "NEO": "NXf4VLBrjUXKtk8NNkeY1zymmbUeQ9RkUu",
        "RSK": "0xa441b5438885c9b5879e7dfa885b5d1b97216d69",
        "BNB": "bnb108w2492d60yurmw6dvrvx8wlecnvuedsuysskq",
        "XINFIN": "xdcD0593B233Be4411A236F22b42087345E1137170b",
        "SOLANA": "HtHf9rJbEeWwpmAbNwZAg5H6sBkRRgwfpLE9ZpysiuQ9",
        "NEAR": "mywish.testnet"
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
    'INFURA_ADDRESS': "https://mainnet.infura.io/v3/ecf1e6d0427b458b89760012a8500abf",
    'ROPSTEN_INFURA_ADDRESS': 'https://ropsten.infura.io/v3/ecf1e6d0427b458b89760012a8500abf',

    'ETHERSCAN_ADDRESS': 'https://etherscan.io/',
    'ROPSTEN_ETHERSCAN_ADDRESS': 'https://ropsten.etherscan.io/',

    'RSK_ADDRESS': 'https://explorer.rsk.co/',
    'RSK_TESTNET_ADDRESS': 'https://explorer.testnet.rsk.co/',

    'RSK_NET_ADDRESS': '/endpoint/rsk',
    'RSK_TESTNET_NET_ADDRESS': '/endpoint/rsk-testnet',

    'BNB_TESTNET_NET_ADDRESS': 'https://data-seed-prebsc-1-s1.binance.org:8545',
    'BNB_NET_ADDRESS': 'https://bsc-dataseed1.binance.org',


    "NEO_TESTNET_ADDRESS": 'https://neo3.neotube.io/',
    "NEO_MAINNET_ADDRESS": 'https://neo3.neotube.io/',

    "EOS_MAINNET_ADDRESS": "https://bloks.io/",
    "EOS_TESTNET_ADDRESS": "https://jungle.bloks.io/",

    "TRON_MAINNET_ADDRESS": "https://tronscan.org/",
    "TRON_TESTNET_ADDRESS": "https://shasta.tronscan.org/",

    "EOS_FLARE_MAINNET_ADDRESS": "https://www.bloks.io/",

    "BNB_TESTNET_ADDRESS": "https://testnet.bscscan.com",
    "BNB_MAINNET_ADDRESS": "https://bscscan.com/",

    "MATIC_MAINNET_PROVIDER": "https://polygonscan.com/",
    "MATIC_TESTNET_PROVIDER": "https://rpc-mumbai.matic.today/",

    "HECOCHAIN_MAINNET_PROVIDER": "https://http-mainnet-node.huobichain.com/",
    "HECOCHAIN_TESTNET_PROVIDER": "https://http-testnet.hecochain.com/",

    "HECOCHAIN_TESTNET_ADDRESS": "https://testnet.hecoinfo.com",
    "HECOCHAIN_MAINNET_ADDRESS": "https://hecoinfo.com",

    "MOONRIVER_MAINNET_PROVIDER": "https://rpc.moonriver.moonbeam.network",

    "MOONRIVER_MAINNET_ADDRESS": "https://blockscout.moonriver.moonbeam.network/",

    "MATIC_TESTNET_ADDRESS": "https://explorer-mumbai.maticvigil.com",
    "MATIC_MAINNET_ADDRESS": "https://explorer-mainnet.maticvigil.com",

    "SOLANA_TESTNET_PROVIDER": "http://localhost:8899",
    "SOLANA_MAINNET_PROVIDER": "http://localhost:8899",


    "SOLANA_TESTNET_ADDRESS": "https://explorer.solana.com",
    "SOLANA_MAINNET_ADDRESS": "https://explorer.solana.com",

    "XINFIN_MAINNET_PROVIDER": "https://rpc.xinfin.network",

    "XINFIN_MAINNET_ADDRESS": "https://explorer.xinfin.network",

    "NEAR_TESTNET_ADDRESS": "https://explorer.testnet.near.org/",

    "NEAR_TESTNET_PROVIDER": "https://rpc.testnet.near.org",

    'EMPTY_PROFILE': {
        "email":"",
        "username":"",
        "contracts":0,
        "is_ghost":true,
        "balance":"0",
        "usdt_balance":"0",
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

