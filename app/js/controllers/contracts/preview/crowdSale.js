angular.module('app').controller('crowdSalePreviewController', function($timeout, $rootScope, contractService, web3Service,
                                                                        openedContract, $scope, $filter) {
    // console.log('crowdSalePreviewController',$scope,$rootScope);
    $scope.contract = openedContract.data;


    $scope.iniContract($scope.contract);


    var getVerificationStatus = function () {
        contractService.getContract($scope.contract.id).then(function(response) {
            console.log('crowdSalePreviewController getVerificationStatus',response);
            $scope.contract.verification_status = response.data.contract_details.verification_status;
        });
    }
    getVerificationStatus();

    var getVerificationCost = function () {
        contractService.getVerificationCost().then(function(response) {
            console.log('crowdSalePreviewController getVerificationCost',response);
            $scope.contract.verificationCost = {
                USDT: new BigNumber(response.data.USDT).div(10e5).toFixed(2).toString(10),
                WISH: new BigNumber(response.data.WISH).div(10e17).toFixed(3).toString(10),
                ETH: new BigNumber(response.data.ETH).div(10e17).toFixed(3).toString(10),
                BTC: new BigNumber(response.data.BTC).div(10e7).toFixed(6).toString(10),
            };
        });
    }
    getVerificationCost();

    var contractDetails = $scope.contract.contract_details;


    switch ($scope.contract.network) {
        case 1:
        case 2:
            $scope.blockchain = 'ETH';
            $scope.contractCrowdsaleInfo = 'eth_contract_crowdsale';
            $scope.contractTokenInfo = 'eth_contract_token';
            break;
        case 5:
        case 6:
            $scope.blockchain = 'NEO';
            $scope.contractCrowdsaleInfo = 'neo_contract_crowdsale';
            $scope.contractTokenInfo = 'neo_contract_token';
            break;
    }


    if (contractDetails.eth_contract_token && contractDetails.eth_contract_token.address) {
        web3Service.setProviderByNumber($scope.contract.network);
        var contractWeb3 = web3Service.createContractFromAbi(
            contractDetails.eth_contract_token.address,
            contractDetails.eth_contract_token.abi
        );

        if (contractWeb3.methods.freezingBalanceOf) {
            contractWeb3.methods.freezingBalanceOf(contractDetails.admin_address).call(function(error, result) {
                if (error) return;
                if (result * 1) {
                    $scope.tokensFreezed = true;
                }
                $scope.$apply();
            });
        }
    }

    $scope.currencyPow = $scope.blockchain === 'NEO' ? 0 : 18;

    if (contractDetails.eth_contract_crowdsale && contractDetails.eth_contract_crowdsale.address) {
        web3Service.setProvider('infura');
        var contract = web3Service.createContractFromAbi(contractDetails.eth_contract_crowdsale.address, contractDetails.eth_contract_crowdsale.abi);
        if (typeof contract.methods.vault === 'function') {
            contract.methods.vault().call(function(error, result) {
                if (error) return;
                contractDetails.eth_contract_crowdsale.vault = result;
                $scope.$apply();
            });
        }
        if (contractDetails.whitelist) {
            contractService.getWhiteList($scope.contract.id, {limit: 1}).then(function(response) {
                $scope.whiteListedAddresses = response.data;
            });
        }
    }

    contractDetails.time_bonuses = contractDetails.time_bonuses || [];
    contractDetails.time_bonuses.map(function(bonus) {
        bonus.min_amount = bonus.min_amount ? new BigNumber(bonus.min_amount).times(contractDetails.rate).div(Math.pow(10,$scope.currencyPow)).toFixed().toString(10) : undefined;
        bonus.max_amount = bonus.max_amount ? new BigNumber(bonus.max_amount).times(contractDetails.rate).div(Math.pow(10,$scope.currencyPow)).toFixed().toString(10) : undefined;
        bonus.min_time = bonus.min_time ? bonus.min_time * 1000 : undefined;
        bonus.max_time = bonus.max_time ? bonus.max_time * 1000 : undefined;
    });

    var bonuses = angular.copy(contractDetails.time_bonuses || []);
    $scope.timeBonusChartData = [];

    bonuses.map(function(currBonus, index) {
        currBonus.isTimesAmount = currBonus.min_time && currBonus.min_time;
        currBonus.isTokensAmount = currBonus.min_amount && currBonus.max_amount;
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

    var amountBonuses = angular.copy(contractDetails.amount_bonuses || []);
    $scope.amountBonusChartData = [];
    amountBonuses.map(function(item) {
        var chartItem = {
            valueY: item.bonus,
            maxValueX: item.max_amount,
            minValueX: item.min_amount
        };
        $scope.amountBonusChartData.push(chartItem);
    });

    if ($scope.blockchain === 'ETH') {
        contractDetails.hard_cap_eth = new BigNumber(contractDetails.hard_cap).div(Math.pow(10,$scope.currencyPow)).toFixed(Math.min(2, contractDetails.decimals)).toString(10);
        contractDetails.soft_cap_eth = new BigNumber(contractDetails.soft_cap).div(Math.pow(10,$scope.currencyPow)).toFixed(Math.min(2, contractDetails.decimals)).toString(10);

        contractDetails.hard_cap = new BigNumber(contractDetails.hard_cap).times(contractDetails.rate).div(Math.pow(10,$scope.currencyPow)).toFixed().toString(10);
        contractDetails.soft_cap = new BigNumber(contractDetails.soft_cap).times(contractDetails.rate).div(Math.pow(10,$scope.currencyPow)).toFixed().toString(10);

        contractDetails.min_wei = contractDetails.min_wei !== null ? contractDetails.min_wei : undefined;
        contractDetails.max_wei = contractDetails.max_wei !== null ? contractDetails.max_wei : undefined;
    }
    if ($scope.blockchain === 'NEO') {
        contractDetails.hard_cap_eth = new BigNumber(contractDetails.hard_cap).toFixed(Math.min(2, contractDetails.decimals)).toString(10);
        contractDetails.hard_cap = new BigNumber(contractDetails.hard_cap).times(contractDetails.rate).toFixed().toString(10);
    }
    $scope.timeBonusChartParams = {
        max_time: contractDetails.stop_date,
        min_time: contractDetails.start_date,
        max_amount: contractDetails.hard_cap,
        min_amount: 0
    };

    contractDetails.amount_bonuses = contractDetails.amount_bonuses || [];
    contractDetails.amount_bonuses.map(function(bonus) {
        bonus.min_amount = new BigNumber(bonus.min_amount).div(Math.pow(10,$scope.currencyPow)).toFixed().toString(10);
        bonus.max_amount = new BigNumber(bonus.max_amount).div(Math.pow(10,$scope.currencyPow)).toFixed().toString(10);
    });

    if (contractDetails.eth_contract_crowdsale) {
        contractDetails.sources = {
            crowdsale: contractDetails.eth_contract_crowdsale.source_code || false,
            token: contractDetails.eth_contract_token.source_code || false
        };
    }

    var powerNumber = new BigNumber('10').exponentiatedBy(contractDetails.decimals || 0);
    contractDetails.token_holders.map(function(holder) {
        holder.amount = new BigNumber(holder.amount).div(powerNumber).toString(10);
    });

    var holdersSum = contractDetails.token_holders.reduce(function (val, item) {
        var value = new BigNumber(item.amount || 0);
        return value.plus(val);
    }, new BigNumber(0));

    var ethSum = holdersSum.plus(contractDetails.hard_cap);
    $scope.totalSupply = {
        eth: ethSum.div(contractDetails.rate).toFixed(2).toString(10),
        tokens: ethSum.toFixed(2).toString(10)
    };


    $scope.chartOptions = {
        itemValue: 'amount',
        itemLabel: 'address'
    };
    $scope.chartData = angular.copy(contractDetails.token_holders);
    $scope.chartData.unshift({
        amount: contractDetails.hard_cap,
        address: $filter('translate')('CONTRACTS.FOR_SALE')
    });


    $scope.verificationBuyRequest = false;
    var verificationBuy = function() {
        $scope.verificationBuyRequest = true;
        const params = {contract_id: $scope.contract.id}
        contractService.buyVerification(params).then(function(response) {
            console.log('buyVerification',response.data)
            $scope.verificationBuyRequest = false;
            window.location.reload();
            // contractService.getContract($scope.contract.id).then(function(response) {
            //     var newContractDetails = response.data.contract_details;
            // })
        }, function(err) {
            switch (err.status) {
                case 400:
                    switch(err.data.result) {
                        case 3:
                        case "3":
                            $rootScope.commonOpenedPopupParams = {
                                newPopupContent: true
                            };
                            $rootScope.commonOpenedPopup = 'errors/authio-less-balance';
                            break;
                    }
                    break;
            }
            $scope.verificationBuyRequest = false;
        });
    };
    $rootScope.contract = $scope.contract
    $rootScope.confirmVerificationPayment = verificationBuy

}).controller('changeDateFormController', function($scope, $interval, APP_CONSTANTS, web3Service, $filter, $rootScope, $timeout) {
    var contract = angular.copy($scope.ngPopUp.params.contract);
    $scope.contract = contract;

    $scope.newDatesFields = {
        start_date: contract.contract_details.start_date,
        stop_date: contract.contract_details.stop_date
    };

    //** Current date/time
    $scope.minStartDate = $rootScope.getNowDateTime(true).add(5, 'minutes');


    /* Update validator for real time */
    var setMinimalDateTimes = function() {
        var nowDateTime = $rootScope.getNowDateTime(true).add(5, 'minutes');

        //** Minimum for finish date
        var minForFinish = Math.max($scope.newDatesFields.start_date + 300, nowDateTime.format('X') * 1);
        $scope.validationDates = {
            minForFinish: minForFinish,
            minForStart: contract.contract_details.start_date
        };
        $scope.startDateIsEnable = !(contract.contract_details.time_bonuses && contract.contract_details.time_bonuses.length) &&
            (contract.contract_details.start_date >= nowDateTime.format('X') * 1);
        $scope.endDateIsEnable = contract.contract_details.stop_date >= nowDateTime.format('X') * 1;

    };

    setMinimalDateTimes();

    var checkMinDateTime = $interval(setMinimalDateTimes, 5000);
    $scope.$on('$destroy', function() {
        $interval.cancel(checkMinDateTime);
    });


    /* Управление датой и временем начала/окончания ICO (begin) */
    var setStartTimestamp = function() {
        var currentSelectedDate = $scope.dates.startDate || moment($scope.newDatesFields.start_date * 1000);
        $scope.dates.startDate = currentSelectedDate.hours($scope.timesForStarting.start.hours).minutes($scope.timesForStarting.start.minutes);
        $scope.newDatesFields.start_date = $scope.dates.startDate.format('X') * 1;
        $scope.validationDates.minForFinish = $scope.newDatesFields.start_date + 300;
        $timeout(function() {
            $scope.$broadcast('pickerUpdate', ['start-date'], {});
        });
    };

    var setStopTimestamp = function() {
        var currentSelectedDate = $scope.dates.endDate || moment($scope.newDatesFields.stop_date * 1000);
        $scope.dates.endDate = currentSelectedDate.hours($scope.timesForStarting.stop.hours).minutes($scope.timesForStarting.stop.minutes);
        $scope.newDatesFields.stop_date = $scope.dates.endDate.format('X') * 1;
        $timeout(function() {
            $scope.$broadcast('pickerUpdate', ['end-date'], {});
        });
    };

    $scope.onChangeStartTime = setStartTimestamp;
    $scope.onChangeStopTime = setStopTimestamp;
    $scope.onChangeStartDate = setStartTimestamp;
    $scope.onChangeEndDate = setStopTimestamp;

    /** Set start values for dates **/
    $scope.dates = {
        startDate: moment($scope.newDatesFields.start_date * 1000),
        endDate: moment($scope.newDatesFields.stop_date * 1000)
    };
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
}).controller('changeDateController', function($scope, web3Service) {

    var contractData = $scope.ngPopUp.params.contract;


    $scope.contract = contractData;
    web3Service.setProviderByNumber(contractData.network);

    var contractDetails = contractData.contract_details, contract;
    var params = [];

    var startDate = $scope.ngPopUp.params.dates.startDate.format('X'),
        endDate = $scope.ngPopUp.params.dates.endDate.format('X');

    var startDateIdent = startDate == contractDetails.start_date;
    var endDateIdent = endDate == contractDetails.stop_date;

    if (!startDateIdent) {
        params.push(startDate);
    }
    if (!endDateIdent) {
        params.push(endDate);
    }
    var methodName = (!startDateIdent && !endDateIdent) ? 'setTimes' : (!startDateIdent ? 'setStartTime' : 'setEndTime');


    switch($scope.ngPopUp.params.contract.contract_type) {
        case 4:
        case 27:
        case 32:
            $scope.contracInfoKey = 'eth_contract_crowdsale';
            break;
        default:
            $scope.contracInfoKey  = 'eth_contract';
            break;
    }

    var contractInfo = contractDetails[$scope.contracInfoKey];

    var interfaceMethod = web3Service.getMethodInterface(methodName, contractInfo.abi);
    if (!interfaceMethod) return;

    $scope.changeDateSignature = (new Web3()).eth.abi.encodeFunctionCall(interfaceMethod, params);

    web3Service.getAccounts(contractData.network).then(function(result) {
        $scope.currentWallet = result.filter(function(wallet) {
            return wallet.wallet.toLowerCase() === contractDetails.admin_address.toLowerCase();
        })[0];
        if ($scope.currentWallet) {
            web3Service.setProvider($scope.currentWallet.type, contractData.network);
            contract = web3Service.createContractFromAbi(contractInfo.address, contractInfo.abi);
        }
    });

    $scope.sendTransaction = function() {
        if (params.length === 2) {
            contract.methods[methodName](params[0], params[1]).send({
                from: $scope.currentWallet.wallet
            }).then(console.log);
        }
        if (params.length === 1) {
            contract.methods[methodName](params[0]).send({
                from: $scope.currentWallet.wallet
            }).then(console.log);
        }

    };
}).controller('whitelistFormController', function($scope, $rootScope, $timeout, contractService) {

    $scope.openedErrors = false;
    $scope.openErrors = function(chapter) {
        $timeout(function() {
            if ($scope.openedErrors) {
                switch ($scope.openedErrors) {
                    case 'errors':
                        $scope.visibleErrors = [];
                        checkVisibleErrors();
                        break;
                    case 'warnings':
                        $scope.visibleWarnings = [];
                        checkVisibleWarnings();
                        break;
                }
            }
            $scope.openedErrors = ($scope.openedErrors !== chapter) ? chapter : false;
            $scope.$apply();
            $scope.$parent.$broadcast('changeContent');
        });
    };

    $scope.resetTable = function() {
        $timeout(function() {
            $scope.visibleAddresses = [];
            $scope.tableData = false;
            $scope.openedErrors = false;
            $scope.visibleErrors = [];
            $scope.visibleWarnings = [];
            $scope.$apply();
            $scope.$parent.$broadcast('changeContent');
        });
    };


    var contract = $scope.ngPopUp.params.contract;

    if (contract.contract_details.whitelist) {
        contractService.getWhiteList(contract.id, {limit: 1000000}).then(function(response) {
            $scope.whiteListedAddresses = response.data.results;
        });
    }

    $scope.showInstruction = function() {
        $timeout(function() {
            $scope.showedInstruction = true;
            $scope.$apply();
            $scope.$parent.$broadcast('changeContent');
        });
    };

    var parseDataForTable = function(results) {
        var parsedData = [];
        var errors = [];
        var lastParsedRow = 0;
        if (!results.data[results.data.length - 1][0]) {
            results.data = results.data.slice(0, results.data.length - 1);
        }
        while ((parsedData.length < 100) && (lastParsedRow < results.data.length)) {
            var index = lastParsedRow;
            var row = results.data[index];
            lastParsedRow++;
            var address = row[0].replace(/^[\s]*([\S]+)[\s]*$/g, '$1');
            if (!address) {
                errors.push({
                    status: 4,
                    row: index + 1,
                    type: 'error'
                });
                continue;
            }
            try {
                var doubleRow;
                if (parsedData.filter(function(addedRow, index) {
                        if (addedRow.address.toLowerCase().replace(/^0x/, '') === address.toLowerCase().replace(/^0x/, '')) {
                            doubleRow = {
                                csvRow: addedRow.row,
                                tableRow: index
                            };
                            return true;
                        }
                    }).length) {
                    errors.push({
                        address: address,
                        status: 3,
                        row: index + 1,
                        doubleLine: doubleRow,
                        type: 'error'
                    });
                    continue;
                }



                if ($scope.whiteListedAddresses.filter(function(addressItem) {
                        return addressItem.address.replace(/^0x/, '') === address.toLowerCase().replace(/^0x/, '');
                    }).length) {
                    errors.push({
                        address: address,
                        status: 5,
                        row: index + 1,
                        type: 'error'
                    });
                    continue;
                }

                var isValidAddress = $rootScope.web3Utils.isAddress(address);
                var checkSumAddress = $rootScope.web3Utils.toChecksumAddress(address);

                if (isValidAddress && (checkSumAddress === address)) {
                    parsedData.push({
                        address: address,
                        status: 0,
                        row: index + 1
                    });
                    continue;
                }
                var rowObject = {
                    address: address,
                    status: 1,
                    row: index + 1,
                    type: 'warning'
                };
                parsedData.push(rowObject);
                errors.push(rowObject);
            } catch(e) {
                errors.push({
                    address: address,
                    status: 2,
                    row: index + 1,
                    type: 'error'
                });
            }
        }

        return {
            result: parsedData,
            firstRow: 0,
            lastRow: lastParsedRow,
            amountRows: results.data.length,
            warnings: errors.filter(function(error) {
                return error.type === 'warning';
            }),
            errors: errors.filter(function(error) {
                return error.type === 'error';
            })
        };
    };

    var visibleCountPlus = 25;

    var errorsScrollProgress = false;
    $scope.visibleErrors = [];
    var checkVisibleErrors = function() {
        if (errorsScrollProgress) return;
        if ($scope.visibleErrors.length === $scope.tableData.errors.length) return;
        errorsScrollProgress = true;
        var newPart = $scope.tableData.errors.slice($scope.visibleErrors.length, $scope.visibleErrors.length + visibleCountPlus);
        $timeout(function() {
            $scope.visibleErrors = $scope.visibleErrors.concat(newPart);
            $scope.$apply();
            errorsScrollProgress = false;
        });
    };

    var warningsScrollProgress = false;
    $scope.visibleWarnings = [];
    var checkVisibleWarnings = function() {
        if (warningsScrollProgress) return;
        if ($scope.visibleWarnings.length === $scope.tableData.warnings.length) return;
        warningsScrollProgress = true;
        var newPart = $scope.tableData.warnings.slice($scope.visibleWarnings.length, $scope.visibleWarnings.length + visibleCountPlus);
        $timeout(function() {
            $scope.visibleWarnings = $scope.visibleWarnings.concat(newPart);
            $scope.$apply();
            warningsScrollProgress = false;
        });
    };

    var addressesScrollProgress = false;
    $scope.visibleAddresses = [];
    var checkVisibleAddresses = function() {
        if (addressesScrollProgress) return;
        if ($scope.visibleAddresses.length === $scope.tableData.result.length) return;
        addressesScrollProgress = true;
        var newPart = $scope.tableData.result.slice($scope.visibleAddresses.length, $scope.visibleAddresses.length + visibleCountPlus);
        $timeout(function() {
            $scope.visibleAddresses = $scope.visibleAddresses.concat(newPart);
            $scope.$apply();
            addressesScrollProgress = false;
        });
    };

    $scope.addressesListOptions = {
        parent: '.csv-addresses-table',
        updater: checkVisibleAddresses,
        offset: 140
    };
    $scope.errorsListOptions = {
        parent: '.csv-errors-info--list',
        updater: checkVisibleErrors,
        offset: 140
    };
    $scope.warningsListOptions = {
        parent: '.csv-errors-info--list',
        updater: checkVisibleWarnings,
        offset: 140
    };

    var createResultData = function(csvData) {
        $scope.tableData = parseDataForTable(csvData);
        checkVisibleErrors();
        checkVisibleWarnings();
        $scope.visibleAddresses = $scope.tableData.result.slice(0, visibleCountPlus);
        $scope.$apply();
        $scope.$parent.$broadcast('changeContent');
    };

    var fileFormats = ['text/csv', 'application/vnd.ms-excel', ''];
    $scope.changeFile = function(fileInput) {
        var file = fileInput.files[0];
        $scope.fileTypeError = false;
        $scope.fileParsingError = false;

        if (fileFormats.indexOf(file.type) === -1) {
            $scope.fileTypeError = true;
            $scope.$apply();
            return;
        }

        Papa.parse(file, {
            complete: createResultData,
            error: function(results, file) {
                console.log("Parsing error:", results);
                $scope.fileParsingError = true;
                $scope.$apply();
            }
        });
    };
}).controller('addWhiteListController', function($scope, web3Service, $rootScope) {
    var contractData = $scope.ngPopUp.params.contract;

    $scope.contract = contractData;
    web3Service.setProviderByNumber(contractData.network);

    var contractDetails = contractData.contract_details, contract;
    var params = [];

    $scope.$parent.tableData.result.map(function(item) {
        params.push($rootScope.web3Utils.toChecksumAddress(item.address));
    });

    var methodName = 'addAddressesToWhitelist';


    switch($scope.ngPopUp.params.contract.contract_type) {
        case 4:
        case 27:
        case 32:
            $scope.contracInfoKey = 'eth_contract_crowdsale';
            break;
        default:
            $scope.contracInfoKey  = 'eth_contract';
            break;
    }

    var contractInfo = contractDetails[$scope.contracInfoKey];

    var interfaceMethod = web3Service.getMethodInterface(methodName, contractInfo.abi);
    try {
        $scope.addWhiteListSignature = (new Web3()).eth.abi.encodeFunctionCall(interfaceMethod, [params]);
    } catch(err) {
        console.log(err);
    }

    web3Service.getAccounts(contractData.network).then(function(result) {
        $scope.currentWallet = result.filter(function(wallet) {
            return wallet.wallet.toLowerCase() === contractDetails.admin_address.toLowerCase();
        })[0];
        if ($scope.currentWallet) {
            web3Service.setProvider($scope.currentWallet.type, contractData.network);
            contract = web3Service.createContractFromAbi(contractInfo.address, contractInfo.abi);
        }
    });

    $scope.sendTransaction = function() {
        contract.methods[methodName](params).send({
            from: $scope.currentWallet.wallet
        }).then(console.log);
    };
}).controller('whiteListPreview', function($scope, contractService, FileSaver, $timeout) {

    var contract = $scope.ngPopUp.params.contract;

    $scope.saveWhiteList = function() {
        contractService.getWhiteList(contract.id, {
            limit: $scope.whiteListedAddresses.count
        }).then(function(response) {
            var data = '';
            response.data.results.map(function(addressItem) {
                data+= addressItem.address + "\n";
            });
            data = new Blob([data], { type: 'text/plain;charset=utf-8' });
            FileSaver.saveAs(data, contract.name + '(whitelist).csv');
        });
    };

    var limitStep = 25;
    $scope.whitelist = [];

    var whiteListLoadingInProgress = false;
    var getNewWhitelistPage = function() {
        if ($scope.whiteListedAddresses && ($scope.whitelist.length === $scope.whiteListedAddresses.count)) return;
        if (whiteListLoadingInProgress) return;
        whiteListLoadingInProgress = true;
        contractService.getWhiteList(contract.id, {
            limit: limitStep,
            offset: $scope.whitelist.length
        }).then(function(response) {
            $scope.whiteListedAddresses = response.data;
            $timeout(function() {
                $scope.whitelist = $scope.whitelist.concat(response.data.results);
                $scope.$apply();
                $scope.$parent.$broadcast('changeContent');
                whiteListLoadingInProgress = false;
            });
        });
    };
    getNewWhitelistPage();

    $scope.addressesListOptions = {
        parent: '.csv-addresses-table',
        updater: getNewWhitelistPage,
        offset: 140
    };

});






