angular.module('Services').service('contractService', function(requestService, API) {
    return {
        getBalance: function (address) {
            var params = {
                path: API.BALANCE,
                params: {
                    address: address
                }
            };
            return requestService.get(params);
        },
        getCost: function (data) {
            var params = {
                path: API.GET_COST,
                query: data
            };
            return requestService.get(params);
        },
        createContract: function (data) {
            var params = {
                path: API.CONTRACTS,
                data: data
            };
            return requestService.post(params);
        },
        updateContract: function (data) {
            var params = {
                path: API.CONTRACTS + data.id + '/',
                data: data,
                method: 'patch'
            };
            return requestService.post(params);
        },

        sendSentences: function (data) {
            var params = {
                path: API.SENTENCES,
                data: data
            };
            return requestService.post(params);
        },
        getCode: function (data) {
            var params = {
                path: API.GET_CODE,
                query: data
            };
            return requestService.get(params);
        },
        getContractsList: function (data) {
            var params = {
                path: API.CONTRACTS,
                query: data
            };
            return requestService.get(params);
        },
        getContract: function(contractId) {
            var params = {
                path: API.CONTRACTS + contractId + '/'
            };
            return requestService.get(params);
        },
        patchParams: function(id, data) {
            var params = {
                path: API.CONTRACTS + id + '/',
                data: data,
                method: 'patch'
            };
            return requestService.post(params);
        },
        deleteContract: function(id) {
            var params = {
                path: API.CONTRACTS + id + '/',
                method: 'delete'
            };
            return requestService.post(params);
        },
        getExchange: function() {
            var params = {
                path: API.ETH2RUB
            };
            return requestService.get(params);
        },
        getCurrencyRate: function(data) {
            var params = {
                path: API.CURRENCY_RATE,
                query: data
            };
            return requestService.get(params);
        },
        deployContract: function(id) {
            var params = {
                path: API.DEPLOY,
                data: {
                    id: id
                }
            };
            return requestService.post(params);
        },
        getTokenContracts: function() {
            var params = {
                path: API.TOKEN_PARAMS
                // query: data
            };
            return requestService.get(params);
        }
    }
});
