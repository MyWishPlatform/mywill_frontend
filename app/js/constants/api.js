angular.module('Constants').constant('API', {
    "USERS": "users/",
    "HOSTS": {
        "TEST": '/',
        "PRODUCTION": '/',
        "PATH": 'api/v1/',
        "AUTH_PATH": 'api/v1/rest-auth/',
        "REST_AUTH": 'rest-auth/',
        "ACCOUNTS_PATH": 'accounts/',
        "CREATE_GHOST": 'create_ghost/'
    },
    "REGISTRATION": "registration/",
    "PROFILE": "profile/",
    "LOGIN": "login/",
    "ADMIN_LOGIN": "administrator/",
    "LOGOUT": "logout/",
    "PASSWORD_RESET": "password/reset/",
    "PASSWORD_CHANGE": "password/change/",
    "PASSWORD_RESET_CONFIRM": "password/reset/confirm/",
    "BALANCE": "balance/",
    "GET_COST": "get_cost/",
    "GET_AUTHIO_COST": "get_authio_cost/",
    "GET_VERIFICATION_COST": "get_verification_cost/",
    "BUY_BRAND_REPORT": "buy_brand_report/",
    "BUY_VERIFICATION": "buy_verification/",
    "GET_EOS_COST": "get_eos_cost/",
    "GET_ALL_COSTS": "get_all_costs/",
    "GET_EOS_AIRDROP_COST": "get_eos_airdrop_cost/",
    "CONTRACTS": "contracts/",
    "CONTRACT_BY_LINK": "get_contract_for_link/",
    "DEPLOY": "deploy/",
    "GET_CODE": "get_code/",
    "SENTENCES": "sentences/",
    "ETH2RUB": "eth2rub/",
    "CURRENCY_RATE": "exc_rate/",
    "TOKEN_PARAMS": "get_token_contracts/",
    "GENERATE_KEY": "generate_key/",
    "ENABLE_2FA": "enable_2fa/",
    "DISABLE_2FA": "disable_2fa/",
    "RESEND_EMAIL": "resend_email/",
    "GET_DISCOUNT": "get_discount/",
    "I_AM_ALIVE": "i_am_alive/",
    "CONTRACT_CANCEL": "cancel/",
    "NEO_ICO_FINALIZE": "neo_ico_finalize/",
    "SET_LNG": "set_lang/",
    "WHITELIST": "whitelist_addresses/",
    "AIRDROP_ADDRESSES": "airdrop_addresses/",
    "EOS_AIRDROP_ADDRESSES": "eos_airdrop_addresses/",
    "LOAD_AIRDROP": "load_airdrop/",
    "CHECK_STATUS": "check_status/",
    "CHECK_EOS_ACCOUNTS": "check_eos_accounts_exists/",
    "SNAPSHOT_GET_VALUE": "snapshot_get_value/",
    "SOCIAL": {
        "FACEBOOK": "facebook/",
        "GOOGLE": "google/",
        "POPUP_URLS": {
            "GOOGLE": "/rest-auth/google/",
            "VK": "/rest-auth/vk/login/",
            "TWITTER": "/rest-auth/twitter/login/"
        }
    },
    "API_KEYS": {
        "CREATE": "create_api_token/",
        "GET": "get_api_tokens/",
        "DELETE": "delete_api_token/",
        "DELETE_ALL": "delete_all_api_tokens/"
    },
    "GET_ETH_TOKENS_FOR_ADDRESS": "get_tokens_for_eth_address/"
});
