angular.module('Services').service('EOSISHCalculatorService', function(requestService, API) {
    return {
        getBalance: function (address, blockchain) {
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
