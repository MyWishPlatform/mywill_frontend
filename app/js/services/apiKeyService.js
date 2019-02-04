angular.module('Services').service('APIKeysService', function(requestService, API) {

    return {
        createToken: function(data) {
            var params = {
                path: API.API_KEYS.CREATE,
                data: data
            };
            return requestService.post(params);
        },
        getTokens: function (address, blockchain) {
            var params = {
                path: API.SNAPSHOT_GET_VALUE,
                params: {
                    address: address,
                    blockchain: blockchain
                }
            };
            return requestService.get(params);
        }
    }
});