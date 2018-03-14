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
    "CONTRACTS": "contracts/",
    "DEPLOY": "deploy/",
    "GET_CODE": "get_code/",
    "SENTENCES": "sentences/",
    "ETH2RUB": "eth2rub/",
    "CURRENCY_RATE": "exc_rate/",
    "TOKEN_PARAMS": "get_token_contracts/",
    "GENERATE_KEY": "generate_key/",
    "ENABLE_2FA": "enable_2fa/",
    "DISABLE_2FA": "disable_2fa/",
    "GET_DISCOUNT": "get_discount/",

    "SOCIAL": {
        "FACEBOOK": "facebook/",
        "GOOGLE": "google/",
        "POPUP_URLS": {
            "GOOGLE": "/rest-auth/google/",
            "VK": "/rest-auth/vk/login/",
            "TWITTER": "/rest-auth/twitter/login/"
        }
    }
});
