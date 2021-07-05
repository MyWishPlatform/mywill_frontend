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
    'INVESTMENT_PULL': 9,
    'EOS_TOKEN': 10,
    'EOS_WALLET': 11,
    'CROWDSALE_EOS': 12,
    'AIRDROP_EOS': 13,
    'EOS_I_TOKEN': 14,
    'TRON_TOKEN': 15,
    'TRON_GA': 16,
    'TRON_AIRDROP': 17,
    'TRON_LOST_KEY': 18,
    'TOKENS_LOST_KEY': 19,
    'WEDDING': '-1',
    'CUSTOM': '-2',

    'BNB_LAST_WILL': 24,
    'BNB_LOST_KEY': 25,
    'BNB_DEFERRED': 26,
    'BNB_CROWD_SALE': 27,
    'BNB_TOKEN': 28,
    'BNB_AIRDROP': 29,
    'BNB_INVESTMENT_PULL': 30,
    'BNB_TOKENS_LOST_KEY': 31,

    'MATIC_TOKEN': 33,
    'MATIC_CROWD_SALE': 32,
    'MATIC_AIRDROP': 34,

    'XINFIN_TOKEN': 35,

    'HECOCHAIN_TOKEN': 36

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
    9: 'investmentPull',
    10: 'eosToken',
    11: 'eosWallet',
    12: 'eosCrowdSale',
    13: 'eosAirdrop',
    14: 'eosIToken',
    15: 'tronToken',
    16: 'tronGA',
    17: 'tronAirdrop',
    18: 'tronLostKey',
    19: 'tokensLostKey',
    22: 'wavesSto',
    23: 'tokenProtector',
    '-1': 'wedding',
    '-2': 'custom',

    24: 'bnbLastWill',
    25: 'bnbLostKey',
    26: 'bnbDeferred',
    27: 'bnbCrowdSale',
    28: 'bnbToken',
    29: 'bnbAirdrop',
    30: 'bnbInvestmentPull',
    31: 'bnbTokensLostKey',

    33: 'maticToken',
    32: 'maticCrowdSale',
    34: 'maticAirdrop',

    35: 'xinfinToken',

    36: 'hecochainToken'


}).service('CONTRACT_TYPES_FOR_CREATE', function(CONTRACT_TYPES_NAMES_CONSTANTS, ENV_VARS) {

    var customContract = {
        'icon': 'icon-custom-contract',
        'title': 'CONTRACTS.FORMS.CUSTOM.TITLE',
        'description': 'CONTRACTS.FORMS.CUSTOM.DESCRIPTION',
        'typeNumber': '-2',
        'type': CONTRACT_TYPES_NAMES_CONSTANTS['-2'],
        'class': 'lighter-type'
    };

    var airdropService = {
        'iconImg': '/static/images/airdrop/airdrop-service.svg',
        'title': 'Airdrop service',
        'description': 'The Smart token distribution to thousands of addresses in batches.\n' +
            'ERC-20 / BEP-20',
        'typeNumber': -1,
        'type': 'AirdropService',
        'directLink': 'https://airdrop.mywish.io/',
        'simplePrice': "50",
        'price': true
    };

    var eth = {
        'networks': [1, 2],
        'list':[{
            'icon': 'icon-token',
            'title': 'PAGES.CREATE_CONTRACT.TOKEN.TITLE',
            'description': 'PAGES.CREATE_CONTRACT.TOKEN.DESCRIPTION',
            'typeNumber': 5,
            'type': CONTRACT_TYPES_NAMES_CONSTANTS[5],
            'price': true
        }, {
            'icon': 'icon-token-protector',
            'title': 'PAGES.CREATE_CONTRACT.TOKEN_PROTECTOR.TITLE',
            'description': 'PAGES.CREATE_CONTRACT.TOKEN_PROTECTOR.DESCRIPTION',
            'typeNumber': 23,
            'type': CONTRACT_TYPES_NAMES_CONSTANTS[23],
            'directLink': 'https://protector.mywish.io/create',
            'price': true
        }, {
            'icon': 'icon-crowdsale',
            'title': 'PAGES.CREATE_CONTRACT.CROWDSALE.TITLE',
            'description': 'PAGES.CREATE_CONTRACT.CROWDSALE.DESCRIPTION',
            'typeNumber': 4,
            'type': CONTRACT_TYPES_NAMES_CONSTANTS[4],
            'price': true
        }, {
            'icon': 'icon-airdrop',
            'title': 'PAGES.CREATE_CONTRACT.AIRDROP.TITLE',
            'description': 'PAGES.CREATE_CONTRACT.AIRDROP.DESCRIPTION',
            'typeNumber': 8,
            'type': CONTRACT_TYPES_NAMES_CONSTANTS[8],
            'price': true
        }, airdropService, {
            'icon': 'icon-investment-pool',
            'title': 'PAGES.CREATE_CONTRACT.INVESTMENT_POOL.TITLE',
            'description': 'PAGES.CREATE_CONTRACT.INVESTMENT_POOL.DESCRIPTION',
            'typeNumber': 9,
            'type': CONTRACT_TYPES_NAMES_CONSTANTS[9],
            'price': true
        }, {
            'icon': 'icon-key',
            'title': 'PAGES.CREATE_CONTRACT.ETH_LOST_KEY.TITLE',
            'description': 'PAGES.CREATE_CONTRACT.ETH_LOST_KEY.DESCRIPTION',
            'typeNumber': 19,
            'type': CONTRACT_TYPES_NAMES_CONSTANTS[19],
            'price': true
        }, {
            'icon': 'icon-key',
            'title': 'PAGES.CREATE_CONTRACT.LOST_KEY.TITLE',
            'description': 'PAGES.CREATE_CONTRACT.LOST_KEY.DESCRIPTION',
            'typeNumber': 1,
            'type': CONTRACT_TYPES_NAMES_CONSTANTS[1]
        }, {
            'icon': 'icon-deferred',
            'title': 'PAGES.CREATE_CONTRACT.DEFERRED.TITLE',
            'description': 'PAGES.CREATE_CONTRACT.DEFERRED.DESCRIPTION',
            'typeNumber': 2,
            'type': CONTRACT_TYPES_NAMES_CONSTANTS[2]
        }, {
            'icon': 'icon-lastwill',
            'title': 'PAGES.CREATE_CONTRACT.WILL.TITLE',
            'description': 'PAGES.CREATE_CONTRACT.WILL.DESCRIPTION',
            'typeNumber': 0,
            'type': CONTRACT_TYPES_NAMES_CONSTANTS[0]
        }, {
            'icon': 'icon-wedding',
            'title': 'PAGES.CREATE_CONTRACT.WEDDING.TITLE',
            'description': 'PAGES.CREATE_CONTRACT.WEDDING.DESCRIPTION',
            'typeNumber': '-1',
            'type': CONTRACT_TYPES_NAMES_CONSTANTS['-1']
        }]
    };

    var matic = {
        'networks': [24, 25],
        'list':[{
            'iconImg': '/static/images/blockchain/polygon-blue.svg',
            // 'icon': 'icon-matic-token',
            'title': 'PAGES.CREATE_CONTRACT.TOKEN.TITLE',
            'description': 'PAGES.CREATE_CONTRACT.TOKEN.DESCRIPTION',
            'typeNumber': 33,
            'type': CONTRACT_TYPES_NAMES_CONSTANTS[33],
            'price': true
        }, {
            'icon': 'icon-matic-crowdsale',
            'title': 'PAGES.CREATE_CONTRACT.CROWDSALE.TITLE',
            'description': 'PAGES.CREATE_CONTRACT.CROWDSALE.DESCRIPTION',
            'typeNumber': 32,
            'type': CONTRACT_TYPES_NAMES_CONSTANTS[32],
            'price': true
        }, {
            'icon': 'icon-matic-airdrop',
            'title': 'PAGES.CREATE_CONTRACT.MATIC_AIRDROP.TITLE',
            'description': 'PAGES.CREATE_CONTRACT.MATIC_AIRDROP.DESCRIPTION',
            'typeNumber': 34,
            'type': CONTRACT_TYPES_NAMES_CONSTANTS[34],
            'price': true
        }]
    }

    var xinfin = {
        'networks': [35],
        'list': [{
            'iconImg': '/static/images/blockchain/xinfin-blue.svg',
            'icon': 'icon-bnb-token',
            'title': 'PAGES.CREATE_CONTRACT.TOKEN.TITLE',
            'description': 'PAGES.CREATE_CONTRACT.TOKEN.DESCRIPTION',
            'typeNumber': 35,
            'type': CONTRACT_TYPES_NAMES_CONSTANTS[35],
            'price': true
        }]
    }
        
    var hecochain = {
        'networks': [28, 36],
        'list':[{
            'iconImg': '/static/images/blockchain/hecochain-blue.svg',
            'title': 'PAGES.CREATE_CONTRACT.TOKEN.TITLE',
            'description': 'PAGES.CREATE_CONTRACT.TOKEN.DESCRIPTION',
            'typeNumber': 36,
            'type': CONTRACT_TYPES_NAMES_CONSTANTS[36],
            'price': true
        }]
    }

    var bnb = {
        'networks': [22, 23],
        'list':[{
            'icon': 'icon-bnb-token',
            'title': 'PAGES.CREATE_CONTRACT.TOKEN.TITLE',
            'description': 'PAGES.CREATE_CONTRACT.TOKEN.DESCRIPTION',
            'typeNumber': 28,
            'type': CONTRACT_TYPES_NAMES_CONSTANTS[28],
            'price': true
        }, {
            'icon': 'icon-bnb-crowdsale',
            'title': 'PAGES.CREATE_CONTRACT.CROWDSALE.TITLE',
            'description': 'PAGES.CREATE_CONTRACT.CROWDSALE.DESCRIPTION',
            'typeNumber': 27,
            'type': CONTRACT_TYPES_NAMES_CONSTANTS[27],
            'price': true
        }, {
            'icon': 'icon-bnb-airdrop',
            'title': 'PAGES.CREATE_CONTRACT.BNB_AIRDROP.TITLE',
            'description': 'PAGES.CREATE_CONTRACT.BNB_AIRDROP.DESCRIPTION',
            'typeNumber': 29,
            'type': CONTRACT_TYPES_NAMES_CONSTANTS[29],
            'price': true
        }, airdropService /*, {
            'icon': 'icon-bnb-investment-pool',
            'title': 'PAGES.CREATE_CONTRACT.BNB_INVESTMENT_POOL.TITLE',
            'description': 'PAGES.CREATE_CONTRACT.BNB_INVESTMENT_POOL.DESCRIPTION',
            'typeNumber': 30,
            'type': CONTRACT_TYPES_NAMES_CONSTANTS[30],
            // 'price': true
        }, {
            'icon': 'icon-key',
            'title': 'PAGES.CREATE_CONTRACT.BNB_TOKENS_LOST_KEY.TITLE',
            'description': 'PAGES.CREATE_CONTRACT.BNB_TOKENS_LOST_KEY.DESCRIPTION',
            'typeNumber': 31,
            'type': CONTRACT_TYPES_NAMES_CONSTANTS[31],
            // 'price': true
        }, {
            'icon': 'icon-key',
            'title': 'PAGES.CREATE_CONTRACT.BNB_LOST_KEY.TITLE',
            'description': 'PAGES.CREATE_CONTRACT.BNB_LOST_KEY.DESCRIPTION',
            'typeNumber': 25,
            'type': CONTRACT_TYPES_NAMES_CONSTANTS[25]
        }, {
            'icon': 'icon-deferred',
            'title': 'PAGES.CREATE_CONTRACT.DEFERRED.TITLE',
            'description': 'PAGES.CREATE_CONTRACT.DEFERRED.DESCRIPTION',
            'typeNumber': 26,
            'type': CONTRACT_TYPES_NAMES_CONSTANTS[26]
        }, {
            'icon': 'icon-lastwill',
            'title': 'PAGES.CREATE_CONTRACT.WILL.TITLE',
            'description': 'PAGES.CREATE_CONTRACT.WILL.DESCRIPTION',
            'typeNumber': 24,
            'type': CONTRACT_TYPES_NAMES_CONSTANTS[24]
        }*/]
    };


    var neo = {
        'networks': [6, 6],
        'list': [{
            'icon': 'icon-token',
            'title': 'PAGES.CREATE_CONTRACT.TOKEN.TITLE',
            'description': 'PAGES.CREATE_CONTRACT.TOKEN.DESCRIPTION',
            'typeNumber': 6,
            'type': CONTRACT_TYPES_NAMES_CONSTANTS[6]
        }, {
            'icon': 'icon-crowdsale',
            'title': 'PAGES.CREATE_CONTRACT.CROWDSALE.TITLE',
            'description': 'PAGES.CREATE_CONTRACT.CROWDSALE.DESCRIPTION',
            'typeNumber': 7,
            'type': CONTRACT_TYPES_NAMES_CONSTANTS[7]
        }]
    };

    var waves = {
        'networks': [16, 17],
        'list': [{
            'icon': 'icon-waves-ico',
            'title': 'STO Crowdsale Contract',
            'description': 'Start your STO/Token sale with a few clicks',
            'typeNumber': 22,
            'type': CONTRACT_TYPES_NAMES_CONSTANTS[22],
            'directLink': 'https://waves.mywish.io/create/crowdsale',
            'price': true
        }]
    };

    var rsk = {
        'networks': [3, 4],
        'list': [{
            'icon': 'icon-lastwill',
            'title': 'PAGES.CREATE_CONTRACT.WILL.TITLE',
            'description': 'PAGES.CREATE_CONTRACT.WILL.DESCRIPTION',
            'typeNumber': 0,
            'type': CONTRACT_TYPES_NAMES_CONSTANTS[0]
        }]
    };


    var eosDefault = {
        // 'networks': [10, 11],
        'networks': [10, 11],
        'list': [{
            'icon': 'icon-eos-wallet',
            'title': 'PAGES.CREATE_CONTRACT.EOS_WALLET.TITLE',
            'description': 'PAGES.CREATE_CONTRACT.EOS_WALLET.DESCRIPTION',
            'typeNumber': 11,
            'type': CONTRACT_TYPES_NAMES_CONSTANTS[11],
            'price': true
        }, {
            'icon': 'icon-token-eos',
            'title': 'PAGES.CREATE_CONTRACT.EOS_TOKEN_PERSONAL.TITLE',
            'description': 'PAGES.CREATE_CONTRACT.EOS_TOKEN_PERSONAL.DESCRIPTION',
            'typeNumber': 14,
            'type': CONTRACT_TYPES_NAMES_CONSTANTS[14],
            'price': true,
            'additional_link': {
                type: 'modal',
                content: 'alcor',
                text: 'Free listing on Alcor.exchange'
            }
        }, {
            'icon': 'icon-token-eos',
            'title': 'PAGES.CREATE_CONTRACT.EOS_TOKEN_MYWISH.TITLE',
            'description': 'PAGES.CREATE_CONTRACT.EOS_TOKEN_MYWISH.DESCRIPTION',
            'typeNumber': 10,
            'type': CONTRACT_TYPES_NAMES_CONSTANTS[10],
            'price': true,
            'additional_link': {
                type: 'modal',
                content: 'alcor',
                text: 'Free listing on Alcor.exchange'
            }
        }, {
            'icon': 'icon-eos-ico',
            'title': 'PAGES.CREATE_CONTRACT.CROWDSALE.TITLE',
            'description': 'PAGES.CREATE_CONTRACT.CROWDSALE.DESCRIPTION',
            'typeNumber': 12,
            'type': CONTRACT_TYPES_NAMES_CONSTANTS[12],
            'price': true,
            'additional_link': {
                type: 'modal',
                content: 'alcor',
                text: 'Free listing on Alcor.exchange'
            }
        }, {
            'icon': 'icon-eos-airdrop',
            'title': 'PAGES.CREATE_CONTRACT.AIRDROP.TITLE',
            'description': 'PAGES.CREATE_CONTRACT.EOS_AIRDROP.DESCRIPTION',
            'typeNumber': 13,
            'type': CONTRACT_TYPES_NAMES_CONSTANTS[13],
            'price': true
        }]
    };

    var tronDefault = {
        'networks': [14, 15],
        'list': [{
            'icon': 'icon-tron-token',
            'title': 'PAGES.CREATE_CONTRACT.TRON_TOKEN.TITLE',
            'description': 'PAGES.CREATE_CONTRACT.TRON_TOKEN.DESCRIPTION',
            'typeNumber': 15,
            'type': CONTRACT_TYPES_NAMES_CONSTANTS[15],
            'price': true
        }, {
            'icon': 'icon-ga',
            'title': 'PAGES.CREATE_CONTRACT.TRON_GA.TITLE',
            'description': 'PAGES.CREATE_CONTRACT.TRON_GA.DESCRIPTION',
            'typeNumber': 16,
            'type': CONTRACT_TYPES_NAMES_CONSTANTS[16],
            'price': true
        }, {
            'icon': 'icon-tron-airdrop',
            'title': 'PAGES.CREATE_CONTRACT.AIRDROP.TITLE',
            'description': 'PAGES.CREATE_CONTRACT.TRON_AIRDROP.DESCRIPTION',
            'typeNumber': 17,
            'type': CONTRACT_TYPES_NAMES_CONSTANTS[17],
            'price': true
        }, airdropService, {
            'icon': 'icon-key',
            'title': 'PAGES.CREATE_CONTRACT.TRON_LOST_KEY.TITLE',
            'description': 'PAGES.CREATE_CONTRACT.TRON_LOST_KEY.DESCRIPTION',
            'typeNumber': 18,
            'type': CONTRACT_TYPES_NAMES_CONSTANTS[18],
            'price': true
        }]
    };

    switch (ENV_VARS.mode) {
        case 'eos':
            return {
                EOS: eosDefault
            };
        case 'tron':
            return {
                TRON: tronDefault
            };
        default:
            return {
                ETH: eth,
                NEO: neo,
                RSK: rsk,
                TRON: tronDefault,
                EOS: eosDefault,
                WAVES: waves,
                BNB: bnb,
                MATIC: matic,
                XINFIN: xinfin,
                HECOCHAIN: hecochain
            };
    }
});
