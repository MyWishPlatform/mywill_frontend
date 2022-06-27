angular.module('Services').service('contractService', function(requestService, API) {

    var setBlockchain = function(contractData) {
        switch(contractData.network) {
            case 22:
            case 23:
                contractData.blockchain = 'BNB';
                break;
            case 24:
            case 25:
                contractData.blockchain = 'MATIC';
                break;
            case 35:
                contractData.blockchain = 'XINFIN';
                break;

        }
    };

    return {
        getBalance: function (address, network) {
            var params = {
                path: API.BALANCE,
                params: {
                    address: address,
                    network: network
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
        getAuthioCost: function (data) {
            // console.log('getAuthioCost');
            var params = {
                path: API.GET_AUTHIO_COST,
                query: data
            };
            return requestService.get(params);
        },
        getVerificationCost: function (data) {
            // console.log('getVerificationCost');
            var params = {
                path: API.GET_VERIFICATION_COST,
                query: data
            };
            return requestService.get(params);
        },
        getWhitelabelCost: function (data) {
            // console.log('getWhitelabelCost');
            var params = {
                path: API.GET_WHITELABEL_COST,
                query: data
            };
            return requestService.get(params);
        },
        buyAuthio: function(data) {
            // console.log('buyAuthio');
            return requestService.post({
                path: API.BUY_BRAND_REPORT,
                data: data
            });
        },
        buyVerification: function(data) {
            // console.log('buyVerification');
            return requestService.post({
                path: API.BUY_VERIFICATION,
                data: data
            });
        },
        getEosAirdropCost: function(data) {
            var params = {
                path: API.GET_EOS_AIRDROP_COST,
                query: data
            };
            return requestService.get(params);
        },
        getEOSCost: function (data) {
            var params = {
                path: API.GET_EOS_COST,
                query: data
            };
            return requestService.get(params);
        },
        getAllCosts: function (type) {
            var data = {};
            var params = {
                path: API.GET_ALL_COSTS
            };
            if (type) {
                data[type] = true;
                params.query = data;
            }
            return requestService.get(params);
        },
        createContract: function (data) {
            data.network = parseInt(data.network);
            var params = {
                path: API.CONTRACTS,
                data: data
            };
            return requestService.post(params);
        },
        updateContract: function (data) {
            data.network = parseInt(data.network);
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
            return requestService.get(params).then(function(result) {
                result.data.results.forEach(setBlockchain);
                return result;
            });
        },
        getContract: function(contractId) {
            var params = {
                path: API.CONTRACTS + contractId + '/'
            };
            return requestService.get(params).then(function(result) {
                setBlockchain(result.data);
                return result;
            });
        },
        getContractForLink: function(contractKey) {
            var params = {
                path: API.CONTRACT_BY_LINK,
                query: {
                    link: contractKey
                }
            };
            return requestService.get(params).then(function(result) {
                setBlockchain(result.data);
                return result;
            });
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
        deployContract: function(id, promo, eos) {
            var params = {
                path: API.DEPLOY,
                data: {
                    id: id,
                    promo: promo,
                    eos: eos
                }
            };
            return requestService.post(params);
        },
        deployContractNear: function(id, promo) {
            var params = {
                path: API.DEPLOY_NEAR,
                data: {
                    contract_id: id,
                    promo: promo,
                }
            };
            return requestService.post(params);
        },
        deployContractNearInit: function(id) {
            var params = {
                path: API.DEPLOY_NEAR + id,
            };
            console.log('params', params);
            return requestService.get(params);
        },
        getTokenContracts: function(network) {
            var params = {
                path: API.TOKEN_PARAMS,
                query: {
                    network: network
                }
            };
            return requestService.get(params);
        },
        getDiscount: function(data) {
            var params = {
                path: API.GET_DISCOUNT,
                query: data
            };
            return requestService.get(params);
        },
        sendIAmAlive: function(data) {
            var params = {
                path: API.I_AM_ALIVE,
                data: data
            };
            return requestService.post(params);
        },
        sendCancelContract: function(data) {
            var params = {
                path: API.CONTRACT_CANCEL,
                data: data
            };
            return requestService.post(params);
        },
        neoICOFilnalize: function(contractId) {
            var params = {
                path: API.NEO_ICO_FINALIZE,
                data: {
                    id: contractId
                }
            };
            return requestService.post(params);
        },
        getWhiteList: function(contractId, paginationParams) {
            paginationParams = paginationParams || {};
            paginationParams.contract = contractId;
            var params = {
                path: API.WHITELIST,
                query: paginationParams
            };
            return requestService.get(params);
        },
        getAirdropAddresses: function(contractId, paginationParams) {
            paginationParams = paginationParams || {};
            paginationParams.contract = contractId;
            var params = {
                path: API.AIRDROP_ADDRESSES,
                query: paginationParams
            };
            return requestService.get(params);
        },
        getEosAirdropAddresses: function(contractId, paginationParams) {
            paginationParams = paginationParams || {};
            paginationParams.contract = contractId;
            var params = {
                path: API.EOS_AIRDROP_ADDRESSES,
                query: paginationParams
            };
            return requestService.get(params);
        },
        loadAirdrop: function(contractId, addresses) {
            var params = {
                path: API.LOAD_AIRDROP,
                data: {
                    id: contractId,
                    addresses: addresses
                }
            };
            return requestService.post(params);
        },
        checkStatus: function(contractId) {
            var params = {
                path: API.CHECK_STATUS,
                data: {
                    id: contractId
                }
            };
            return requestService.post(params);
        },
        checkEOSAccounts: function(accounts) {
            var params = {
                path: API.CHECK_EOS_ACCOUNTS,
                data: {
                    accounts: accounts
                }
            };
            return requestService.post(params);
        }
    }
});
