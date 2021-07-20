angular.module('app').controller('contractsController', function(CONTRACT_STATUSES_CONSTANTS, $rootScope, ENV_VARS,
                                                                 contractsList, $scope, $state, contractService, APP_CONSTANTS) {

    $scope.statuses = CONTRACT_STATUSES_CONSTANTS;
    $scope.stateData  = $state.current.data;

    var contractsData = contractsList.data;
    $scope.contractsList = contractsData ? contractsData.results : [];


    $scope.testAddresses = APP_CONSTANTS.TEST_ADDRESSES;


    $scope.goToContract = function(contract, $event) {
        var target = angular.element($event.target);
        if (!(target.is('[click-ignore]') || target.parents('[click-ignore]').length) &&  (target.is('.btn') || target.parents('.btn').length)) return;
        var contractId = contract.id;
        if ((contract.contract_type === 5) && (contract.state === 'UNDER_CROWDSALE')) {
            contractId = contract.contract_details.crowdsale || contractId;
        }
        $state.go('main.contracts.preview.byId', {id: contractId});
    };

    var updateList = function() {
        $rootScope.commonOpenedPopupParams = false;
        $rootScope.commonOpenedPopup = false;
        $state.transitionTo($state.current, {}, {
            reload: true,
            inherit: false,
            notify: true
        });
    };

    $scope.$on('$userUpdated', updateList);

    $scope.deleteContract = function(contract) {
        $scope.$parent.deleteContract(contract, function() {
            $scope.contractsList = $scope.contractsList.filter(function(contractItem) {
                return contract !== contractItem;
            });
        });
    };

    var contractsUpdateProgress = false;
    var getContracts = function() {
        if (contractsUpdateProgress) return;
        if (contractsData.count === $scope.contractsList.length) return;
        contractsUpdateProgress = true;
        contractService.getContractsList({
            limit: 8,
            offset: $scope.contractsList.length,
            eos: ENV_VARS.mode === 'eos' ? 1 : undefined
        }).then(function(response) {
            contractsData = response.data;
            $scope.contractsList = $scope.contractsList.concat(response.data.results);
            contractsUpdateProgress = false;
        });
    };
    $scope.contractsListParams = {
        updater: getContracts,
        offset: 100
    };

}).controller('baseContractsController', function($scope, $state, $timeout, contractService, $cookies,
                                                  web3Service, WebSocketService, EOSService, CONTRACT_TYPES_FOR_CREATE,
                                                  $rootScope, $interval, CONTRACT_STATUSES_CONSTANTS) {

    $scope.contractTypesIcons = {};

    for (var i in CONTRACT_TYPES_FOR_CREATE) {
        CONTRACT_TYPES_FOR_CREATE[i]['list'].map(function(contractType) {
            $scope.contractTypesIcons[contractType['typeNumber']] = contractType['icon'];
        });
    }

    var deletingProgress;
    $scope.refreshInProgress = {};
    $scope.timeoutsForProgress = {};
    $scope.statuses = CONTRACT_STATUSES_CONSTANTS;

    /* (Click) Deleting contract */
    $scope.deleteContract = function(contract, callback) {
        if (deletingProgress) return;
        deletingProgress = true;
        contractService.deleteContract(contract.id).then(function() {
            deletingProgress = false;
            callback ? callback() : $state.go('main.contracts.list');
        }, function() {
            deletingProgress = false;
            callback ? callback() : false;
        });
    };


    var setContractStatValues = function(contract) {
        console.log('[SET CONTRACT VALUE]', contract)
        console.log('[STATUS]', $scope.statuses[contract.state])
        switch (contract.contract_type) {
            case 11:
                switch (contract.state) {
                    case 'CREATED':
                        contract.state = 'DRAFT';
                        break;
                    case 'WAITING_FOR_DEPLOYMENT':
                        contract.state = 'CREATING';
                        break;
                }
                break;
            case 8:
            case 29:
            case 34:
                if (contract.contract_details.processing_count) {
                    contract.state = 'SENDING_TOKENS';
                }
                break;
            case 9:
            case 30:
                if (($rootScope.getNowDateTime(true).format('X') * 1 > contract.contract_details.stop_date) && (contract.stateValue === 4)) {
                    contract.state = 'CANCELLED';
                }
                break;
            case 13:
                if (contract.contract_details.processing_count) {
                    contract.state = 'SENDING_TOKENS';
                }
                break;

        }
        contract.stateValue = $scope.statuses[contract.state]['value'];
        contract.stateTitle = $scope.statuses[contract.state]['title'];
    };

    var iniSocketHandler = function(contract) {
        var updateContract = function(newContractData) {
            angular.merge(contract, newContractData);
            WebSocketService.offUpdateContract(contract.id, updateContract);
            $scope.iniContract(contract, true);
            $scope.$apply();
        };
        WebSocketService.onUpdateContract(contract.id, updateContract);
        $scope.$on('$destroy', function() {
            WebSocketService.offUpdateContract(contract.id, updateContract);
        });
    };

    var iniEOSContract = function(contract, fullScan) {
        switch (contract.contract_type) {
            case 12:
                var buttons = contract.contract_details.buttons = {};
                var nowDateTime = $rootScope.getNowDateTime(true).format('X') * 1;

                var noStarted = nowDateTime < contract.contract_details.start_date;
                if (noStarted) return;

                if ((contract.stateValue === 4) || (contract.stateValue === 11)) {
                    var softCap = contract.contract_details.soft_cap * 1;
                    var hardCap = contract.contract_details.hard_cap * 1;

                    if (!fullScan) return;

                    EOSService.getTableRows(
                        contract.contract_details.crowdsale_address,
                        'state',
                        contract.contract_details.crowdsale_address,
                        contract.network
                    ).then(function(result) {

                        contract.contract_details.raised_amount =
                            result.rows[0].total_tokens / contract.contract_details.rate / Math.pow(10, contract.contract_details.decimals);

                        if (contract.stateValue !== 4) return;

                        if ((nowDateTime > result.rows[0].finish) || (hardCap <= result.rows[0].total_tokens)) {
                            contractService.checkStatus(contract.id).then(function(response) {

                                var oldState = contract.state;
                                angular.merge(contract, response.data);

                                contract.contract_details.stop_date = result.rows[0].finish;
                                contract.contract_details.start_date = result.rows[0].start;

                                if (oldState !== contract.state) {
                                    $scope.iniContract(contract, false, true);
                                } else {
                                    if (nowDateTime > contract.contract_details.stop_date) {
                                        if (softCap <= result.rows[0].total_tokens) {
                                            buttons.finalize = true;
                                        }
                                    } else if (hardCap <= result.rows[0].total_tokens) {
                                        buttons.finalize = true;
                                    }
                                }
                            });
                        }
                        if (result.rows[0].total_eoses && (softCap <= result.rows[0].total_tokens) && contract.contract_details.protected_mode) {
                            buttons.withdraw = true;
                        }
                    });
                }
                break;
        }
    };

    var iniNeoContract = function(contract, fullScan) {};

    var iniRSKContract = function(contract, fullScan) {};

    var iniETHContract = function(contract, fullScan) {
        $scope.isAuthor = contract.user === $rootScope.currentUser.id;

        switch (contract.contract_type) {
            case 5:
            case 33:
            case 28:
                contract.isAuthioToken = (contract.state === 'ACTIVE') || (contract.state === 'DONE') || (contract.state === 'ENDED');
                contract.withAuthioForm = contract.isAuthioToken && !contract.contract_details.authio;
                if (contract.withAuthioForm) {
                    contractService.getAuthioCost().then(function(response) {
                        contract.authioPrices = {
                            WISH: new BigNumber(response.data.WISH).div(Math.pow(10, 18)).round(2).toString(10),
                            ETH: new BigNumber(response.data.ETH).div(Math.pow(10, 18)).round(2).toString(10),
                            USDT: new BigNumber(response.data.USDT).div(Math.pow(10, 6)).round(2).toString(10),
                        };
                    });
                }
                contract.withVerificationForm = contract.isAuthioToken && !contract.contract_details.verification;
                if (contract.withVerificationForm) {
                    contractService.getVerificationCost().then(function(response) {
                        console.log('getVerificationCost',response.data)
                        contract.verificationPrices = {
                            WISH: new BigNumber(response.data.WISH).div(Math.pow(10, 18)).round(2).toString(10),
                            ETH: new BigNumber(response.data.ETH).div(Math.pow(10, 18)).round(2).toString(10),
                            USDT: new BigNumber(response.data.USDT).div(Math.pow(10, 6)).round(2).toString(10),
                        };
                    });
                }
                break;
            case 0:
            case 1:
            case 2:
            case 4:
            case 24:
            case 25:
            case 26:
            case 27:
            case 28:
            case 32:
            case 35:
            case 36:
                if (contract.contract_details.eth_contract) {
                    contract.currency = ((contract.network == 1) || (contract.network == 2)) ? 'ETH' :
                        ((contract.network == 3) || (contract.network == 4)) ? 'SBTC' : 'Unknown';
                    $scope.networkName = contract.currency;
                    if (contract.contract_details.eth_contract.address) {
                        web3Service.setProviderByNumber(contract.network);
                        web3Service.getBalance(contract.contract_details.eth_contract.address).then(function(result) {
                            contract.balance = Web3.utils.fromWei(result, 'ether');
                        });
                    }
                }
            break;
            case 19:
            case 31:
                contract.maxTokensLimit = 400;
                if (contract.state === 'ACTIVE') {
                    web3Service.setProviderByNumber(contract.network);
                    var lostKeyContract = web3Service.createContractFromAbi(
                        contract.contract_details.eth_contract.address,
                        contract.contract_details.eth_contract.abi
                    );
                    lostKeyContract.methods.getTokenAddresses().call().then(function(result) {
                        contract.contract_details.confirmed_addresses = result;
                    }).finally(function() {
                        $scope.$apply();
                    });
                }
                break;
        }

        if (!contract.contract_details.eth_contract) return;

        if (contract.contract_type === 8 || contract.contract_type === 29) {
            contract.balance = undefined;
        }


        var buttons = contract.contract_details.buttons = {};

        switch (contract.contract_type) {
            case 9:
            case 30:
                var nowDateTime = $rootScope.getNowDateTime(true).format('X') * 1;

                contract.contract_details.raised_amount = contract.contract_details.balance || '0';
                var balance = new BigNumber(contract.contract_details.raised_amount);
                if ((contract.stateValue === 6) &&  (balance > 0)) {
                    buttons.investment_refund = true;
                }
                if (contract.contract_details.last_balance * 1) {
                    contract.contract_details.raised_percent = balance.minus(contract.contract_details.last_balance).div(contract.contract_details.last_balance) * 100;
                } else if (balance > 0) {
                    contract.contract_details.raised_percent = 100;
                } else {
                    contract.contract_details.raised_percent = undefined;
                }
                if (contract.contract_details.token_address && (($state.current.name === 'main.contracts.preview.byId')||(contract.stateValue === 11))) {
                    var infoData = (($state.current.name === 'main.contracts.preview.byId') || ($state.current.name === 'main.contracts.preview.public')) ? ['decimals', 'symbol'] : [];
                    if ((contract.stateValue === 11) || (contract.stateValue === 6)) {
                        infoData.push('balanceOf');
                    }
                    web3Service.setProviderByNumber(contract.network);
                    web3Service.getTokenInfo(
                        contract.network,
                        contract.contract_details.token_address,
                        contract.contract_details.eth_contract.address,
                        infoData
                    ).then(function(result) {
                        contract.tokenInfo = result;
                        if (result.balance * 1) {
                            contract.balance = result.balance;
                        }
                    });
                }

                switch (contract.stateValue) {
                    case 4:
                        buttons.investment_pool_deposit = (nowDateTime < contract.contract_details.stop_date) && (nowDateTime > contract.contract_details.start_date);

                        var softCapCompleted = balance.minus(contract.contract_details.soft_cap) >= 0;
                        var hardCapCompleted = balance.minus(contract.contract_details.hard_cap) >= 0;

                        var isSoftCapSendFunds = softCapCompleted && contract.contract_details.send_tokens_soft_cap;
                        var isHardCapSendFunds = hardCapCompleted && contract.contract_details.send_tokens_hard_cap;


                        buttons.send_funds = contract.contract_details.token_address && contract.contract_details.investment_address &&
                            (nowDateTime > contract.contract_details.start_date) &&
                            (
                                ((softCapCompleted && $scope.isAuthor) || isSoftCapSendFunds) ||
                                ((hardCapCompleted && $scope.isAuthor) || isHardCapSendFunds)
                            );

                        buttons.send_funds_only_author = buttons.send_funds && !(isSoftCapSendFunds || isHardCapSendFunds);

                        if ($scope.isAuthor) {
                            buttons.change_date = (nowDateTime < contract.contract_details.stop_date) && contract.contract_details.allow_change_dates;
                            buttons.whitelist = contract.contract_details.whitelist;
                            buttons.set_token = !contract.contract_details.token_address;
                            buttons.set_investment = !contract.contract_details.investment_address;
                            buttons.cancel = true;
                            buttons.settings =
                                buttons.change_date || buttons.whitelist || buttons.set_token || buttons.set_investment;
                        }
                        break;
                    case 11:
                        web3Service.setProviderByNumber(contract.network);
                        var iPoolContract = web3Service.createContractFromAbi(contract.contract_details.eth_contract.address, contract.contract_details.eth_contract.abi);

                        var contractInvestmentsParams = ['investorsCount', 'BATCH_SIZE'];
                        var contractInvestmentsData = {};
                        var allMethodsCount = contractInvestmentsParams.length;

                        var checkActivePage = function(callback) {
                            var pagesLength = Math.ceil(
                                contractInvestmentsData['investorsCount']/contractInvestmentsData['BATCH_SIZE']
                            );

                            var currentPage = 0;
                            var getTokensOnPage = function() {
                                web3Service.setProviderByNumber(contract.network);
                                iPoolContract.methods['pageTokenAmount'](currentPage).call(function(error, result) {
                                    var intResult = result * 1;
                                    if (!intResult) {
                                        currentPage++;
                                        (currentPage < pagesLength) ? getTokensOnPage() : callback();
                                    } else {
                                        callback(currentPage)
                                    }
                                });
                            };
                            getTokensOnPage();
                        };

                        var getParamData = function(methodName) {
                            web3Service.setProviderByNumber(contract.network);
                            web3Service.callMethod(iPoolContract, methodName).then(function(result) {
                                contractInvestmentsData[methodName] = result;
                                allMethodsCount--;
                                if (!allMethodsCount) {
                                    checkActivePage(function(page) {
                                        buttons.send_tokens = page;
                                        $scope.$apply();
                                    });
                                }
                            });
                        };

                        while (contractInvestmentsParams.length) {
                            getParamData(contractInvestmentsParams.pop());
                        }

                        break;
                }
                break;
        }
    };

    $scope.iniContract = function(contract, fullScan, noWS) {

        contract.original_cost = contract.cost;

        if (!noWS) {
            iniSocketHandler(contract);
        }

        contract.original_cost = contract.cost;

        switch (contract.network) {
            case 1:
            case 2:
            case 22:
            case 23:
            case 24:
            case 25:
            case 28:
            case 35:
            case 36:
                setContractStatValues(contract);
                iniETHContract(contract, fullScan);
                break;
            case 3:
            case 4:
                setContractStatValues(contract);
                iniRSKContract(contract, fullScan);
                break;
            case 6:
                setContractStatValues(contract);
                iniNeoContract(contract, fullScan);
                break;
            case 10:
            case 11:
                setContractStatValues(contract);
                iniEOSContract(contract, fullScan);
                if ($cookies.get('partnerpromo') && ($state.current.name === "main.contracts.preview.byId") && (contract.stateValue === 1)) {
                    contract.promo = $cookies.get('partnerpromo');
                    $scope.getDiscount(contract, true);
                }
                break;
            case 14:
            case 15:
                // iniEOSContract(contract, fullScan);
                contract.cost.TRONISH = contract.cost.TRONISH || contract.cost.TRX;
                setContractStatValues(contract);
        }
    };

    /* (Click) Contract refresh */
    $scope.refreshContract = function(contract) {
        var contractId = contract.id;
        if ($scope.timeoutsForProgress[contractId]) return;
        $scope.refreshInProgress[contractId] = true;
        $scope.timeoutsForProgress[contractId] = $interval(function() {
            if (!$scope.refreshInProgress[contractId]) {
                $interval.cancel($scope.timeoutsForProgress[contractId]);
                $scope.timeoutsForProgress[contractId] = false;
            }
        }, 1000);
        contractService.getContract(contractId).then(function(response) {
            angular.merge(contract, response.data);
            $scope.iniContract(contract, true);
            $scope.refreshInProgress[contractId] = false;
        }, function() {
            $scope.refreshInProgress[contractId] = false;
        });
    };

    var contractsTypesForLayer = {
        0: 'will',
        1: 'lost_key',
        2: 'deferred',
        4: 'crowdsale',
        5: 'token',
        6: 'neo_token',
        7: 'neo_crowdsale',
        8: 'airdrop',
        9: 'invest',
        10: 'eos_token',
        11: 'eos_wallet',
        12: 'eos_crowdsale',
        13: 'eos_airdrop',
        14: 'eos_i_token',
        15: 'tron_token',
        16: 'game_assets',
        17: 'tron_airdrop',
        27: 'bnb_crowdsale',
        28: 'bnb_token',
        29: 'bnb_airdrop',
        32: 'matic_crowdsale',
        33: 'matic_token',
        34: 'matic_airdrop',
        35: 'xinfin_token',
        36: 'hecochain_token'
    };

    var launchContract = function(contract) {
        if (contract.launchProgress) return;
        contract.launchProgress = true;

        $rootScope.closeCommonPopup();

        contractService.deployContract(contract.id, contract.promo, ($rootScope.sitemode === 'eos') ? true : undefined).then(function() {
            contract.launchProgress = false;

            // add event to GTM
            var testNetwork = [2, 4, 6, 11, 15, 23, 25, 36].indexOf(contract.network) > -1;
            var contractType = contractsTypesForLayer[contract.contract_type] || 'unknown';

            if (window['dataLayer']) {
                window['dataLayer'].push({'event': contractType + '_contract_launch_success' + (testNetwork ? '_test' : '')});
            }

            if ($state.current.name === 'main.contracts.list') {
                $scope.refreshContract(contract);
            } else {
                $state.go('main.contracts.list');
            }
        }, function(data) {
            $rootScope.closeCommonPopup();
            contract.launchProgress = false;
            switch(data.status) {
                case 400:
                    switch(data.data.result) {
                        case 1:
                        case '1':
                            $rootScope.commonOpenedPopupParams = {
                                newPopupContent: true
                            };
                            $rootScope.commonOpenedPopup = 'errors/contract_date_incorrect';
                            break;
                        case 2:
                        case '2':
                            $rootScope.commonOpenedPopupParams = {
                                newPopupContent: true
                            };
                            $rootScope.commonOpenedPopup = 'errors/contract_freeze_date_incorrect';
                            break;
                        case 3:
                        case '3':
                            $rootScope.commonOpenedPopupParams = {
                                noBackgroundCloser: true,
                                newPopupContent: true
                            };
                            $rootScope.commonOpenedPopup = 'errors/less-balance';

                            break;
                    }
                    break;
            }
        });
    };

    /* (Click) Launch contract */
    $scope.payContract = function(contract) {
        if ($rootScope.currentUser.is_ghost) {
            $rootScope.commonOpenedPopup = 'alerts/ghost-user-alarm';
            $rootScope.commonOpenedPopupParams = {
                newPopupContent: true
            };
            return;
        }
        var openConditionsPopUp = function() {
            $rootScope.commonOpenedPopupParams = {
                contract: contract,
                class: 'conditions',
                newPopupContent: true,
                actions: {
                    showPriceLaunchContract: showPriceLaunchContract
                }
            };
            $rootScope.commonOpenedPopup = 'disclaimers/conditions';
        };

        var promoIsEntered = $scope.getDiscount(contract);
        if (promoIsEntered) {
            promoIsEntered.then(openConditionsPopUp, openConditionsPopUp);
        } else {
            openConditionsPopUp();
        }
    };

    var showPriceLaunchContract = function(contract) {

        if (contract.cost.WISH == 0) {
            launchContract(contract);
            return;
        }

        var contractConfirmTpl;
        switch (contract.contract_type) {
            case 11:
                contractConfirmTpl = 'confirmations/account-confirm-pay';
                break;
            default:
                contractConfirmTpl = 'confirmations/contract-confirm-pay';
                break;

        }

        var price, currency;

        switch ($rootScope.sitemode) {
            case 'eos':
                price = new BigNumber(contract.cost.EOSISH).div(10000).round(2);
                currency = 'EOSISH';
                break;
            case 'tron':
                price = new BigNumber(contract.cost.TRONISH).div(1000000).round(2);
                currency = 'TRONISH';
                break;
            default:
                price = new BigNumber(Web3.utils.fromWei(contract.cost.WISH, 'ether')).round(2);
                currency = 'WISH';
        }

        $rootScope.commonOpenedPopup = contractConfirmTpl;

        $rootScope.commonOpenedPopupParams = {
            newPopupContent: true,
            currency: currency,
            class: 'deleting-contract',
            contract: contract,
            confirmPayment: launchContract,
            contractCost: price.toString(10)
        };
    };

    $scope.getDiscount = function(contract, noPopUp) {

        if (!contract.promo) return;
        contract.checkPromoProgress = true;


        return contractService.getDiscount({
            contract_type: contract.contract_type,
            contract_id: contract.id,
            promo: contract.promo
        }).then(function(response) {
            contract.cost = response.data.discount_price;
            contract.cost.TRONISH = contract.cost.TRONISH || contract.cost.TRX;
            var price, currency;
            switch ($rootScope.sitemode) {
                case 'eos':
                    price = new BigNumber(contract.cost.EOSISH).div(10000).round(2);
                    currency = 'EOSISH';
                    break;
                case 'tron':
                    price = new BigNumber(contract.cost.TRONISH).div(1000000).round(2);
                    currency = 'TRONISH';
                    break;
                default:
                    price = new BigNumber(Web3.utils.fromWei(contract.cost.WISH, 'ether')).round(2);
                    currency = 'WISH';
            }
            $rootScope.commonOpenedPopupParams = {
                currency: currency,
                price: price,
                contract: contract,
                newPopupContent: true
            };
            if (!noPopUp) {
                $rootScope.commonOpenedPopup = 'alerts/promo-code-activated';
            }
            contract.checkPromoProgress = false;
        }, function(response) {
            switch (response.status) {
                case 403:
                    contract.discountError = response.data.detail;
                    break;
            }
            contract.checkPromoProgress = false;
        });
    };

    $scope.neoCrowdSaleFinalize = function(contract) {
        contractService.neoICOFilnalize(contract.id).then(function(reponse) {
            $rootScope.commonOpenedPopup = 'alerts/neo-finalize-success';
            $scope.refreshContract(contract);
        }, function(reponse) {
            switch (reponse.status) {
                case 400:
                    switch(reponse.data.result) {
                        case 2:
                        case '2':
                            $rootScope.commonOpenedPopupParams = {
                                contract: contract
                            };
                            $rootScope.commonOpenedPopup = 'alerts/neo-finalize-denied';
                            break;
                    }
                    break;
            }
        });
    };

});
