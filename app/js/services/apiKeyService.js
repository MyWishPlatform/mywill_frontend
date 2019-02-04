angular.module('Services').service('APIKeysService', function(requestService, API) {

    return {
        createToken: function(data) {
            var params = {
                path: API.API_KEYS.CREATE,
                data: data
            };
            return requestService.post(params);
        },
        getTokens: function () {
            var params = {
                path: API.API_KEYS.GET
            };
            return requestService.get(params);
        },
        deleteToken: function(tokenKey) {
            var params = {
                path: API.API_KEYS.DELETE,
                method: 'delete',
                data: {
                    token: tokenKey
                },
                headers: {
                    'Content-Type': 'application/json'
                }
            };
            return requestService.post(params);
        },
        deleteTokens: function() {
            var params = {
                path: API.API_KEYS.DELETE_ALL,
                method: 'delete',
                headers: {
                    'Content-Type': 'application/json'
                }
            };
            return requestService.post(params);
        }
    }
});
