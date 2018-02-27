angular.module('app').controller('crowdSaleCreateController', function(exRate, $scope, currencyRate, contractService, $location, tokensList,
                                                                       openedContract, $timeout, $state, $rootScope, CONTRACT_TYPES_CONSTANTS) {


    var web3 = new Web3();

    try {
        web3.setProvider(new Web3.providers.HttpProvider(APP_CONSTANTS.INFURA_ADDRESS));
    } catch(err) {
        console.log('Infura not found');
    }

    $scope.tokensList = tokensList.data;
    $scope.tokensList.map(function(token) {
        token.name = token.token_name + ' (' + token.token_short_name + ')'
    });

    $scope.tokensList.unshift({
        name: 'Create new token'
    });
    $scope.token = {};
    $scope.changeToken = function() {
        if (!$scope.token.selectedToken.id) return;
        var contract = new web3.eth.Contract(abi);
        contract.options.address = $scope.token.selectedToken.address;
        var seelctedToken = $scope.token.selectedToken;
        contract.methods.totalSupply().call(function(error, result) {
            if (error) return;
            seelctedToken.totalSupply = new BigNumber(result).div(Math.pow(10,$scope.token.selectedToken.decimals)).toString(10);
            $scope.$broadcast('tokensCapChanged');
            $scope.$apply();
        });
    };

    $scope.wishCost = new BigNumber(exRate.data.WISH).round(2).toString(10);
    $scope.currencyRate = currencyRate.data;

    var contract = openedContract && openedContract.data ? openedContract.data : {
        name:  'MyCrowdSale' + ($rootScope.currentUser.contracts + 1),
        contract_details: {
            token_holders: [],
            amount_bonuses: [],
            time_bonuses: []
        }
    };


    if (contract.contract_details.continue_minting) {
        $location.hash('pre-sale');
    }

    /* Управление датой и временем начала/окончания ICO (begin) */
    var setStartTimestamp = function() {
        if (!$scope.dates.startDate) {
            $scope.dates.startDate = moment($scope.request.start_date * 1000);
        }
        $scope.dates.startDate.hours($scope.timesForStarting.start.hours).minutes($scope.timesForStarting.start.minutes);
        if ($scope.dates.startDate < $scope.minStartDate) {
            $scope.dates.startDate = $scope.minStartDate.clone();
        }
        $timeout(function() {
            $scope.request.start_date = $scope.dates.startDate.clone().hours($scope.timesForStarting.start.hours).minutes($scope.timesForStarting.start.minutes).format('X') * 1;
            $scope.$broadcast('pickerUpdate', ['start-date'], {});
        });
        $scope.$broadcast('icoTimesChanged');
    };
    var setStopTimestamp = function() {
        if (!$scope.dates.endDate) {
            $scope.dates.endDate = moment($scope.request.stop_date * 1000);
        }
        $scope.dates.endDate.hours($scope.timesForStarting.stop.hours).minutes($scope.timesForStarting.stop.minutes);
        if ($scope.dates.endDate < $scope.minStartDate) {
            $scope.dates.endDate = $scope.minStartDate.clone();
        }
        $timeout(function() {
            $scope.request.stop_date = $scope.dates.endDate.clone().hours($scope.timesForStarting.stop.hours).minutes($scope.timesForStarting.stop.minutes).format('X') * 1;
            $scope.$broadcast('pickerUpdate', ['end-date'], {});
        });
        $scope.$broadcast('icoTimesChanged');
    };
    $scope.onChangeStartTime = setStartTimestamp;
    $scope.onChangeStopTime = setStopTimestamp;
    $scope.onChangeStartDate = setStartTimestamp;
    $scope.onChangeEndDate = setStopTimestamp;
    $scope.checkTokensAmount = function() {
        $scope.$broadcast('tokensCapChanged');
    };


    /* Управление датой и временем начала/окончания ICO (end) */
    var contractInProgress = false;
    $scope.createContract = function() {
        if (contractInProgress) return;
        $scope.$broadcast('createContract');

        var contractDetails = angular.copy($scope.request);

        if ($scope.token.selectedToken.id) {
            contractDetails.eth_contract_token = {
                id: $scope.token.selectedToken.id
            };
            contractDetails.token_name =
                contractDetails.token_short_name =
                    contractDetails.decimals = undefined;
        }

        contractDetails.rate = contractDetails.rate * 1;
        contractDetails.decimals = contractDetails.decimals * 1;
        contractDetails.start_date = contractDetails.start_date * 1;
        contractDetails.stop_date = contractDetails.stop_date * 1;
        contractDetails.hard_cap = new BigNumber(contractDetails.hard_cap).div(contractDetails.rate).times(Math.pow(10,18)).round().toString(10);
        contractDetails.soft_cap = new BigNumber(contractDetails.soft_cap).div(contractDetails.rate).times(Math.pow(10,18)).round().toString(10);
        var data = {
            name: $scope.contractName,
            contract_type: CONTRACT_TYPES_CONSTANTS.CROWD_SALE,
            contract_details: contractDetails,
            id: contract.id
        };
        contractInProgress = true;
        contractService[!contract.id ? 'createContract' : 'updateContract'](data).then(function(response) {
            contractInProgress = false;
            $state.go('main.contracts.preview.byId', {id: response.data.id});
        }, function(data) {
            switch(data.status) {
                case 400:
                    switch(data.data.result) {
                        case '1':
                            $rootScope.commonOpenedPopup = 'contract_date_incorrect';
                            break;
                    }
                    break;
            }
            contractInProgress = false;
        });
    };
    $scope.editContractMode = !!contract.id;
    $scope.resetForms = function() {
        $scope.request = angular.copy(contract.contract_details);
        if ($scope.request.reused_token) {
            $scope.token.selectedToken = $scope.tokensList.filter(function(token) {
                return token.id === $scope.request.eth_contract_token.id;
            })[0];
            if ($scope.token.selectedToken) {
                $scope.changeToken();
            }
        }
        $scope.contractName = contract.name;
        $scope.minStartDate = moment();
        $scope.dates = {
            startDate: $scope.editContractMode ? moment(contract.contract_details.start_date * 1000) : $scope.minStartDate.clone().add(1, 'days'),
            endDate: $scope.editContractMode ? moment(contract.contract_details.stop_date * 1000) : $scope.minStartDate.clone().add(1, 'days').add(1, 'months')
        };
        $scope.minStartDate.add(5, 'minutes').second(0);
        $scope.timesForStarting = {
            start: {
                hours: $scope.dates.startDate.hours(),
                minutes: $scope.dates.startDate.minutes()
            },
            stop: {
                hours: $scope.dates.endDate.hours(),
                minutes: $scope.dates.endDate.minutes()
            }
        };
        if ($scope.request.hard_cap) {
            $scope.request.hard_cap = new BigNumber($scope.request.hard_cap).times($scope.request.rate).div(Math.pow(10,18)).round().toString(10);
        }
        if ($scope.request.soft_cap) {
            $scope.request.soft_cap = new BigNumber($scope.request.soft_cap).times($scope.request.rate).div(Math.pow(10,18)).round().toString(10);
        }
        setStartTimestamp();
        setStopTimestamp();
        $scope.$broadcast('resetForm');
    };
    $scope.resetForms();

}).controller('crowdSaleTimeBonusesController', function($scope, $timeout) {
    $scope.addTokenBonus = function() {
        var newBonus = {};
        $scope.bonuses.push(newBonus);
        $scope.createTimeBonusChartData();
    };
    $scope.deleteTokenBonus = function(bonus) {
        $scope.bonuses = $scope.bonuses.filter(function(bns) {
            return bns !== bonus;
        });
        $scope.createTimeBonusChartData();
    };
    $scope.changeTokensBonusData = function() {
        $scope.bonuses.map(function(bonus, index) {
            var prevTokenBonuses = $scope.bonuses.filter(function(currBonus, currIndex) {
                return (currIndex < index) && (currBonus.isTokensAmount);
            });
            var prevTokenBonus = prevTokenBonuses[prevTokenBonuses.length - 1];
            bonus.forCheckTokens = {
                prev: prevTokenBonus ? new BigNumber(prevTokenBonus.max_amount) : false
            };
            if (prevTokenBonus) {
                bonus.min_amount = bonus.max_amount ? prevTokenBonus.max_amount : undefined;
            }
        });
        $scope.createTimeBonusChartData();
    };
    $scope.changeBonusTokensTrigger = function(bonus) {
        if (!bonus.tokenBonusState && !bonus.isTokensAmount) {
            return;
        }
        bonus.tokenBonusState = bonus.isTokensAmount;
        if (bonus.isTokensAmount) {
            var indexOfBonus = $scope.bonuses.indexOf(bonus);
            var nextTokensBonus = $scope.bonuses.filter(function(currBonus, index) {
                return (index > indexOfBonus) && currBonus.isTokensAmount;
            })[0];
            var prevTokenBonuses = $scope.bonuses.filter(function(currBonus, index) {
                return (index < indexOfBonus) && currBonus.isTokensAmount;
            });
            var prevTokenBonus = prevTokenBonuses[prevTokenBonuses.length - 1];
            bonus.min_amount = prevTokenBonus ? prevTokenBonus.max_amount : '0';
            bonus.max_amount = bonus.max_amount || (nextTokensBonus ? nextTokensBonus.min_amount : $scope.request.hard_cap);
        } else {
            bonus.min_amount = bonus.max_amount = undefined;
        }
        $scope.changeTokensBonusData();
    };
    $scope.changeTimesBonusData = function() {
        $scope.bonuses.map(function(bonus, index) {
            var prevTokenBonuses = $scope.bonuses.filter(function(currBonus, currIndex) {
                return (currIndex < index) && (currBonus.isTimesAmount);
            });
            var prevTokenBonus = prevTokenBonuses[prevTokenBonuses.length - 1];
            if (prevTokenBonus) {
                bonus.forCheckDates = {
                    prev: {
                        date: prevTokenBonus ? moment(prevTokenBonus.max_time * 1000) : false
                    }
                };
                bonus.forCheckDates.prev.time = {
                    hours: bonus.forCheckDates.prev.date.hours(),
                    minutes: bonus.forCheckDates.prev.date.minutes()
                };
                bonus.min_time = bonus.max_time ? prevTokenBonus.max_time : undefined;
            } else {
                bonus.forCheckDates = false;
            }
        });
        $scope.createTimeBonusChartData();
    };
    $scope.changeBonusTimesTrigger = function(bonus) {
        if (!bonus.timeBonusState && !bonus.isTimesAmount) {
            return;
        }
        bonus.timeBonusState = bonus.isTimesAmount;
        if (bonus.isTimesAmount) {
            var indexOfBonus = $scope.bonuses.indexOf(bonus);
            var nextTokensBonus = $scope.bonuses.filter(function(currBonus, index) {
                return (index > indexOfBonus) && currBonus.isTimesAmount;
            })[0];
            var prevTokenBonuses = $scope.bonuses.filter(function(currBonus, index) {
                return (index < indexOfBonus) && currBonus.isTimesAmount;
            });
            var prevTokenBonus = prevTokenBonuses[prevTokenBonuses.length - 1];
            bonus.date_from = prevTokenBonus ? prevTokenBonus.date_to.clone() : $scope.dates.startDate.clone();
            bonus.date_to = nextTokensBonus ? nextTokensBonus.date_from.clone() : $scope.dates.endDate.clone();
            bonus.min_time = bonus.date_from.format('X') * 1;
            bonus.max_time = bonus.date_to.format('X') * 1;
            bonus.time_from = {
                hours: bonus.date_from.hours(),
                minutes: bonus.date_from.minutes()
            };
            bonus.time_to = {
                hours: bonus.date_to.hours(),
                minutes: bonus.date_to.minutes()
            };
        } else {
            bonus.time_to = bonus.time_from =
                bonus.date_to = bonus.date_from =
                    bonus.min_time = bonus.max_time = undefined;
        }
        $scope.changeTimesBonusData();
    };
    $scope.onChangeBonusDate = function(path, value, model) {
        if (path === 'bonus.date_from') {
            var prevBonus = $scope.bonuses.filter(function(bonus) {
                return bonus.date_from === value;
            })[0];
            $scope.onChangeBonusTime({field: 'time_from', model: prevBonus});
        }
        if (path === 'bonus.date_to') {
            var nextBonus = $scope.bonuses.filter(function(bonus) {
                return bonus.date_to === value;
            })[0];
            $scope.onChangeBonusTime({field: 'time_to', model: nextBonus});
        }
    };
    $scope.onChangeBonusTime = function(data) {
        var bonus = data.model;
        if (data.field === 'time_from') {
            if (!bonus.date_from) return;
            bonus.date_from.hours(bonus.time_from.hours).minutes(bonus.time_from.minutes);
            bonus.min_time = bonus.date_from.format('X') * 1;
        }
        if (data.field === 'time_to') {
            if (!bonus.date_to) return;
            bonus.date_to.hours(bonus.time_to.hours).minutes(bonus.time_to.minutes);
            bonus.max_time = bonus.date_to.format('X') * 1;
        }
        $scope.changeTimesBonusData();
    };
    var resetFormData = function() {
        $scope.bonuses = angular.copy($scope.request.time_bonuses);
        $scope.bonuses.map(function(bonus) {
            bonus.min_amount+= '';
            bonus.tokenBonusState = bonus.isTokensAmount = !!(bonus.max_amount && bonus.min_amount);
            bonus.timeBonusState = bonus.isTimesAmount = !!(bonus.max_time && bonus.min_time);

            if (bonus.isTimesAmount) {
                bonus.date_from = moment(bonus.min_time * 1000);
                bonus.date_to = moment(bonus.max_time * 1000);
                bonus.time_from = {
                    hours: bonus.date_from.hours(),
                    minutes: bonus.date_from.minutes()
                };
                bonus.time_to = {
                    hours: bonus.date_to.hours(),
                    minutes: bonus.date_to.minutes()
                };
            }
            if (bonus.isTokensAmount) {
                bonus.min_amount = new BigNumber(bonus.min_amount).times($scope.request.rate).div(Math.pow(10,18)).round().toString(10);
                bonus.max_amount = new BigNumber(bonus.max_amount).times($scope.request.rate).div(Math.pow(10,18)).round().toString(10);
            }
        });
        $scope.changeTokensBonusData();
        $scope.changeTimesBonusData();
    };
    var createdContractData = function() {
        $scope.request.time_bonuses = [];
        $scope.bonuses.map(function(bonus) {
            $scope.request.time_bonuses.push({
                bonus: bonus.bonus,
                max_amount: bonus.max_amount ? new BigNumber(bonus.max_amount).div($scope.request.rate).times(Math.pow(10,18)).round().toString(10) : undefined,
                min_amount: (bonus.max_amount && (bonus.forCheckTokens.prev || bonus.min_amount)) ? new BigNumber(bonus.forCheckTokens.prev || bonus.min_amount).div($scope.request.rate).times(Math.pow(10,18)).round().toString(10) : undefined,
                max_time: bonus.max_time,
                min_time: bonus.min_time
            });
        });
    };
    $scope.$on('resetForm', resetFormData);
    $scope.$on('createContract', createdContractData);
    var timeBonusChartDataTimeout;
    $scope.createTimeBonusChartData = function() {
        timeBonusChartDataTimeout ? $timeout.cancel(timeBonusChartDataTimeout) : false;
        timeBonusChartDataTimeout = $timeout(function() {
            $scope.timeBonusChartData = [];
            var bonuses = angular.copy($scope.bonuses);
            bonuses.map(function(currBonus, index) {
                var bonus = {
                    bonus: currBonus.bonus,
                    min_amount: currBonus.min_amount,
                    max_amount: currBonus.max_amount,
                    min_time: currBonus.min_time,
                    max_time: currBonus.max_time
                };
                var indexOfTimeBonus = bonuses.indexOf(currBonus);
                var prevTimeBonuses = bonuses.filter(function(bon, index) {
                    return (index < indexOfTimeBonus) && bon.isTimesAmount;
                });
                var prevTimeBonus = prevTimeBonuses[prevTimeBonuses.length - 1];
                var prevTokenBonuses = bonuses.filter(function(bon, index) {
                    return (index < indexOfTimeBonus) && bon.isTokensAmount;
                });
                var prevTokenBonus = prevTokenBonuses[prevTokenBonuses.length - 1];
                var prevOnlyTimeBonuses = bonuses.filter(function(bon, index) {
                    return (index < indexOfTimeBonus) && bon.isTimesAmount && !bon.isTokensAmount;
                });
                var prevOnlyTimeBonus = prevOnlyTimeBonuses[prevOnlyTimeBonuses.length - 1];

                var prevOnlyTokenBonuses = bonuses.filter(function(bon, index) {
                    return (index < indexOfTimeBonus) && bon.isTokensAmount && !bon.isTimesAmount;
                });
                var prevOnlyTokenBonus = prevOnlyTokenBonuses[prevOnlyTokenBonuses.length - 1];
                if (!currBonus.isTimesAmount) {
                    // bonus.min_time = prevTimeBonus ? prevTimeBonus.max_time : false;
                    // bonus.max_time = false;
                }
                if (prevOnlyTimeBonus !== prevTimeBonus) {
                    bonus.prev_min_time = prevOnlyTimeBonus ? prevOnlyTimeBonus.max_time : false;
                } else {
                    bonus.prev_min_time = bonus.min_time;
                }
                if (!currBonus.isTokensAmount) {
                    // bonus.min_amount = prevTokenBonus ? prevTokenBonus.max_amount : false;
                    // bonus.max_amount = false;
                }
                if (prevOnlyTokenBonus !== prevTokenBonus) {
                    bonus.prev_min_amount = prevOnlyTokenBonus ? prevOnlyTokenBonus.max_amount : false;
                } else {
                    bonus.prev_min_amount = bonus.min_amount;
                }
                $scope.timeBonusChartData.push(bonus);
            });

            $scope.timeBonusChartParams = {
                max_time: $scope.request.stop_date,
                min_time: $scope.request.start_date,
                max_amount: $scope.request.hard_cap,
                min_amount: 0
            };

            timeBonusChartDataTimeout = false;
        }, 200);
    };
    $scope.$on('icoTimesChanged', $scope.createTimeBonusChartData);
    $scope.$on('tokensCapChanged', $scope.createTimeBonusChartData);
    resetFormData();
}).controller('crowdSaleAmountBonusesController', function($scope) {
    $scope.addAmountBonus = function() {
        $scope.bonuses.push({
            min_amount: !$scope.bonuses.length ? 0 : $scope.bonuses[$scope.bonuses.length - 1]['max_amount'],
            max_amount: new BigNumber($scope.request.hard_cap).div($scope.request.rate).floor()
        });
    };
    $scope.deleteAmountBonus = function(bonus) {
        $scope.bonuses = $scope.bonuses.filter(function(bns) {
            return bns !== bonus;
        });
        $scope.createAmountBonusChartData();
    };
    $scope.createAmountBonusChartData = function() {
        $scope.amountBonusChartData = [];

        if (!$scope.amountBonusForm.$valid) return;

        if (!$scope.bonuses.length) return;

        var bonuses = angular.copy($scope.bonuses);

        var firstBonus = bonuses[0];
        var lastBonus = bonuses[bonuses.length - 1];
        lastBonus.max_amount = lastBonus.max_amount || new BigNumber($scope.request.hard_cap).div($scope.request.rate).floor().toString();

        if (isNaN(firstBonus.min_amount)) return;

        bonuses.map(function(item) {
            var chartItem = {
                valueY: item.bonus,
                maxValueX: item.max_amount,
                minValueX: item.min_amount
            };
            $scope.amountBonusChartData.push(chartItem);
        });
    };
    $scope.$on('tokensCapChanged', $scope.createAmountBonusChartData);
    var resetFormData = function() {
        $scope.bonuses = angular.copy($scope.request.amount_bonuses);
        $scope.bonuses.map(function(bonus) {
            bonus.min_amount = new BigNumber(bonus.min_amount).div(Math.pow(10,18)).round().toString(10);
            bonus.max_amount = new BigNumber(bonus.max_amount).div(Math.pow(10,18)).round().toString(10);
        });
    };
    var createdContractData = function() {
        $scope.request.amount_bonuses = [];
        $scope.bonuses.map(function(bonus) {
            $scope.request.amount_bonuses.push({
                bonus: bonus.bonus,
                max_amount: new BigNumber(bonus.max_amount).times(Math.pow(10,18)).round().toString(10),
                min_amount: new BigNumber(bonus.min_amount).times(Math.pow(10,18)).round().toString(10)
            });
        });
    };
    resetFormData();
    $scope.$on('resetForm', resetFormData);
    $scope.$on('createContract', createdContractData);
    $scope.createAmountBonusChartData();
}).controller('crowdSaleHoldersController', function($scope, $timeout) {
    $scope.addRecipient = function() {
        var holder = {
            freeze_date: $scope.dates.endDate.clone().add(1, 'minutes')
        };
        $scope.token_holders.push(holder);
        $scope.onChangeDateOfRecipient('', holder.freeze_date);
    };
    $scope.removeRecipient = function(recipient) {
        $scope.token_holders = $scope.token_holders.filter(function(rec) {
            return rec !== recipient;
        });
    };
    $scope.checkTokensAmount = function() {
        var holdersSum = $scope.token_holders.reduce(function (val, item) {
            var value = new BigNumber(item.amount || 0);
            return value.plus(val);
        }, new BigNumber(0));

        var stringValue = holdersSum.toString(10);

        $scope.tokensAmountError = isNaN($scope.request.hard_cap) || isNaN(stringValue);

        if (!$scope.tokensAmountError) {
            var ethSum = holdersSum.plus($scope.request.hard_cap);


            if ($scope.token.selectedToken.id && $scope.token.selectedToken.totalSupply) {
                ethSum = ethSum.plus($scope.token.selectedToken.totalSupply);
            }

            $scope.totalSupply = {
                eth: ethSum.div($scope.request.rate).round(2).toString(10),
                tokens: ethSum.round(2).toString(10)
            };
            $timeout(function() {
                $scope.dataChanged();
                $scope.$apply();
            });
        }
    };
    $scope.chartOptions = {
        itemValue: 'amount',
        itemLabel: 'address'
    };
    $scope.chartData = [];
    $scope.dataChanged = function() {
        $scope.chartData = angular.copy($scope.token_holders);
        $scope.chartData.unshift({
            amount: $scope.request.hard_cap,
            address: 'For Sale'
        });

        if ($scope.token.selectedToken.id) {
            $scope.chartData.unshift({
                amount: $scope.token.selectedToken.totalSupply,
                address: 'Pre-Sale'
            })
        }

        $scope.chartOptions.updater ? $scope.chartOptions.updater() : false;
    };
    $scope.onChangeDateOfRecipient = function(path, value) {
        $scope.token_holders.filter(function(holder) {
            return holder.freeze_date === value;
        })[0]['parsed_freeze_date'] = value.format('X') * 1;
    };
    var resetFormData = function() {
        $scope.token_holders = angular.copy($scope.request.token_holders);
        var powerNumber = new BigNumber('10').toPower($scope.request.decimals || 0);
        $scope.token_holders.map(function(holder) {
            holder.isFrozen = !!holder.freeze_date;
            holder.freeze_date = holder.freeze_date ? moment(holder.freeze_date * 1000) : $scope.dates.endDate;
            holder.amount = new BigNumber(holder.amount).div(powerNumber).toString(10);
            holder.parsed_freeze_date = holder.freeze_date.format('X') * 1;
        });
    };
    var createdContractData = function() {
        $scope.request.token_holders = [];
        var powerNumber = new BigNumber('10').toPower($scope.request.decimals || 0);
        $scope.token_holders.map(function(holder, index) {
            $scope.request.token_holders.push({
                freeze_date: holder.isFrozen ? holder.freeze_date.add(1, 'seconds').format('X') * 1 : null,
                amount: new BigNumber(holder.amount).times(powerNumber).toString(10),
                address: holder.address,
                name: holder.name || null
            });
        });
    };
    resetFormData();
    $scope.$on('resetForm', resetFormData);
    $scope.$on('createContract', createdContractData);
    $scope.checkTokensAmount();
    $scope.$on('tokensCapChanged', $scope.checkTokensAmount);
}).controller('crowdSaleActivation', function($scope, web3Service) {
    var contractDetails = $scope.ngPopUp.params.contract.contract_details, contract;

    var interfaceMethod = web3Service.getMethodInterface('transferOwnership', contractDetails.eth_contract_token.abi);
    $scope.activateSignature = (new Web3()).eth.abi.encodeFunctionCall(
        interfaceMethod,
        [contractDetails.eth_contract_crowdsale.address]
    );

    web3Service.getAccounts().then(function(result) {
        $scope.currentWallet = result.filter(function(wallet) {
            return wallet.wallet.toLowerCase() === contractDetails.admin_address.toLowerCase();
        })[0];
        if ($scope.currentWallet) {
            web3Service.setProvider($scope.currentWallet.type);
            contract = web3Service.createContractFromAbi(contractDetails.eth_contract_token.address, contractDetails.eth_contract_token.abi);
        }
    });
    $scope.sendTransaction = function() {
        contract.methods.transferOwnership(contractDetails.eth_contract_crowdsale.address).send({
            from: $scope.currentWallet.wallet
        }).then(console.log);
    };
}).controller('crowdSaleFinalize', function($scope, web3Service) {
    var contractDetails = $scope.ngPopUp.params.contract.contract_details, contract;

    var interfaceMethod = web3Service.getMethodInterface('finalize', contractDetails.eth_contract_crowdsale.abi);
    $scope.activateSignature = (new Web3()).eth.abi.encodeFunctionCall(interfaceMethod);

    web3Service.getAccounts().then(function(result) {

        $scope.currentWallet = result.filter(function(wallet) {
            return wallet.wallet.toLowerCase() === contractDetails.admin_address.toLowerCase();
        })[0];

        if ($scope.currentWallet) {
            web3Service.setProvider($scope.currentWallet.type);
            contract = web3Service.createContractFromAbi(contractDetails.eth_contract_crowdsale.address, contractDetails.eth_contract_crowdsale.abi);
        }
    });
    $scope.sendTransaction = function() {
        contract.methods.finalize().send({
            from: $scope.currentWallet.wallet
        }).then(console.log);
    };
});
