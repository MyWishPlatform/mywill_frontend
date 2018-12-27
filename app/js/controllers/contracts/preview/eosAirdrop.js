angular.module('app').controller('eosAirdropPreviewController', function($timeout, openedContract,
                                                                      $scope, contractService, EOSService) {
    $scope.contract = openedContract.data;
    $scope.tokenInfo  = {};

    var airdropAccount = $scope.contract.contract_details.eos_contract.address;

    var getTokenInfo = function() {
        var symbol = $scope.contract.contract_details.token_short_name;
        EOSService.callCustomMethod('get_table_entry ', {
            code: airdropAccount,
            table: 'drop',
            scope: airdropAccount,
            key: $scope.contract.id
        }, $scope.contract.network).then(function(response) {
            var result = response.data.available.quantity.split(' ');
            $scope.tokenInfo['balance'] = new BigNumber(result[0]).toString(10);
            $scope.tokenInfo['symbol'] = symbol;
            $scope.tokenInfo['decimals'] = result[0].split('.')[1].length;
        }, function(response) {
            // getTokenInfo();
        });
    };

    var timerContractUpdater;
    var refreshContract = function() {
        if (($scope.contract.stateValue === 4) || ($scope.contract.stateValue === 101)) {
            timerContractUpdater = $timeout(function() {
                contractService.getContract($scope.contract.id).then(function(response) {
                    if (!timerContractUpdater) return;
                    response.data.showedTab = $scope.contract.showedTab;
                    angular.merge($scope.contract, response.data);
                    checkContractPreview(true);
                })
            }, 3000);
        }
    };

    var checkContractPreview = function() {
        $scope.iniContract($scope.contract);
        var details = $scope.contract.contract_details;
        details.all_count = details.added_count + details.processing_count + details.sent_count;

        if (($scope.contract.stateValue === 4) || ($scope.contract.stateValue === 101) || ($scope.contract.stateValue === 11)) {
            getTokenInfo();
        }
        refreshContract();
    };

    checkContractPreview();

    $scope.scatterNotInstalled = false;
    $scope.closeScatterAlert = function() {
        $scope.scatterNotInstalled = false;
        $scope.accountNotFinded = false;
        $scope.txServerError = false;
    };

    $scope.$on('$destroy', function() {
        if (timerContractUpdater) {
            $timeout.cancel(timerContractUpdater);
            timerContractUpdater = false;
        }
    });

}).controller('eosAirdropAddressesFormController', function($scope, Webworker, $timeout, contractService, $state, EOSService) {

    /* Get token decimals */

    $scope.formWaiting = false;
    $scope.csvFormat = {};
    $scope.tokenInfo = $scope.ngPopUp.params.tokenInfo;

    var contract = $scope.ngPopUp.params.contract;
    var visibleCountPlus = 25;

    var fileFormats = ['text/csv', 'application/vnd.ms-excel', ''];

    // Check errors for values
    var parseDataForTable = function(results, csvFormat, decimals) {
        var addressRegExp = /^[a-z1-5]{12}$/;
        if (!results.data[results.data.length - 1][0]) {
            results.data = results.data.slice(0, results.data.length - 1);
        }
        var changeAmountParam = 1;
        if (!csvFormat.decimals) {
            changeAmountParam = Math.pow(10, decimals);
        }
        var errorsData = [], resultsData = [];
        results.data.forEach(function(row, index) {
            var resultRow = {
                data: row,
                line: index + 1
            };
            var address = row[0] = row[0].replace(/^[\s]*([\S]+)[\s]*$/g, '$1');
            var amount = row[1];
            if (!address) {
                resultRow.error = {
                    status: 1
                };
                errorsData.push(resultRow);
                return;
            }
            if (!addressRegExp.test(address)) {
                resultRow.error = {
                    status: 2
                };
                errorsData.push(resultRow);
                return;
            }
            if (!amount || isNaN(amount)) {
                resultRow.error = {
                    status: 3
                };
                errorsData.push(resultRow);
                return;
            }
            if ((amount * 1 <= 0) || ((amount * changeAmountParam) % 1 > 0)) {
                resultRow.error = {
                    status: 4
                };
                errorsData.push(resultRow);
                return;
            }
            resultsData.push(resultRow);
        });
        return {
            errors: errorsData,
            results: resultsData
        }
    };


    var accountsPartSize = 20000;

    var checkAccounts = function(allAccounts, callback) {
        var result = [], errors = [];
        var callGetAccountsPart = function() {

            var partAccounts = allAccounts.slice(0, accountsPartSize);
            allAccounts = allAccounts.slice(accountsPartSize, allAccounts.length);

            var addresses = partAccounts.map(function(res) {
                return res.data[0];
            });

            EOSService.callCustomMethod('get_accounts ', {
                accounts: addresses,
                verbose: false
            }, contract.network).then(function(response) {

                response.data.map(function(item, index) {
                    if (!item) {
                        partAccounts[index]['error'] = {
                            status: 5
                        };
                    } else if (result.length >= contract.contract_details.address_count) {
                        partAccounts[index]['error'] = {
                            status: 6
                        };
                    }
                    if (partAccounts[index]['error']) {
                        errors.push(partAccounts[index]);
                    } else {
                        result.push(partAccounts[index]);
                    }
                });


                if (allAccounts.length && (result.length < contract.contract_details.address_count)) {
                    callGetAccountsPart();
                    return;
                } else {
                    allAccounts.map(function(item) {
                        item['error'] = {
                            status: 6
                        };
                    });
                    errors = errors.concat(allAccounts);
                }
                callback(result, errors);
            })
        };
        callGetAccountsPart();
    };


    var createResultData = function(csvData) {
        var myWorker = Webworker.create(parseDataForTable);
        myWorker.run(csvData, $scope.csvFormat, $scope.tokenInfo.decimals).then(function(result) {
            checkAccounts(result.results, function(results, errors) {
                result.results = results;
                result.errors = result.errors.concat(errors);

                $timeout(function() {
                    $scope.tableData = result;
                    $scope.visibleAddresses = angular.copy($scope.tableData.results.slice(0, visibleCountPlus));
                    convertAmount($scope.visibleAddresses);
                    $scope.formWaiting = false;
                    $scope.$apply();
                    $scope.$parent.$broadcast('changeContent');
                });
            });

        });
    };
    var resetCSVData = function() {
        $scope.tableData = undefined;
        $scope.visibleErrors = [];
        $scope.fileTypeError = false;
        $scope.fileParsingError = false;
    };

    $scope.resetTable = function() {
        $timeout(function() {
            resetCSVData();
            $scope.$apply();
            $scope.$parent.$broadcast('changeContent');
        });
    };

    var parseFile = function(options, file) {
        if (fileFormats.indexOf(file.type) === -1) {
            $scope.fileTypeError = true;
            $scope.$apply();
            return;
        }
        $scope.formWaiting = true;
        $scope.$apply();
        $scope.$parent.$broadcast('changeContent');
        Papa.parse(file, {
            delimiter: options.delimiter,
            newline: options.newline,
            complete: createResultData,
            error: function(results, file) {
                console.log("Parsing error:", results);
                $scope.fileParsingError = true;
                $scope.formWaiting = false;
                $scope.$apply();
                $scope.$parent.$broadcast('changeContent');
            }
        });
        $scope.$apply();
    };

    $scope.changeFile = function(fileInput) {
        resetCSVData();
        var file = fileInput.files[0];
        var reader = new FileReader();
        reader.onload = function(evt) {
            var filecontent = evt.target.result;
            /[1-5a-z]{12}/g.test(filecontent);
            var lastMatch = RegExp.lastMatch;
            var searchIndex = filecontent.indexOf(lastMatch);
            var delimiter = filecontent[searchIndex + lastMatch.length];
            var newLine = undefined;
            if (searchIndex) {
                newLine = filecontent[searchIndex - 1];
            }
            parseFile({
                delimiter: delimiter || "",
                newline: newLine || ""
            }, file);
        };
        reader.readAsText(file);
    };

    /* Results of CSV data displaying */
    var addressesScrollProgress = false;
    var convertAmount = function(part) {
        part.map(function(partItem) {
            if ($scope.csvFormat.decimals) {
                partItem.data[2] = partItem.data[1]/ (Math.pow(10, $scope.tokenInfo.decimals));
            } else {
                partItem.data[2] = partItem.data[1];
            }
        });
    };
    var getNewAirdropPage = function() {
        if (addressesScrollProgress) return;
        if ($scope.visibleAddresses.length === $scope.tableData.results.length) return;
        addressesScrollProgress = true;
        var newPart = angular.copy($scope.tableData.results.slice($scope.visibleAddresses.length, $scope.visibleAddresses.length + visibleCountPlus));
        convertAmount(newPart);
        $timeout(function() {
            $scope.visibleAddresses = $scope.visibleAddresses.concat(newPart);
            $scope.$apply();
            addressesScrollProgress = false;
        });
    };
    $scope.addressesListOptions = {
        parent: '.csv-addresses-table',
        updater: getNewAirdropPage,
        offset: 140
    };

    $scope.saveAddressesError = false;
    $scope.resetTimeOutError = function() {
        $timeout(function() {
            $scope.saveAddressesError = false;
            $scope.$apply();
            $scope.$parent.$broadcast('changeContent');
        });
    };

    /* upload addresses to airdrop contract */
    $scope.addAddresses = function() {
        if ($scope.formWaiting) return;
        $timeout(function() {
            $scope.formWaiting = true;
            $scope.$apply();
            $scope.$parent.$broadcast('changeContent');

            var airdropAddresses = $scope.tableData.results.map(function(addressRow) {
                return {
                    address: addressRow.data[0],
                    amount: !$scope.csvFormat.decimals ?
                        addressRow.data[1] * Math.pow(10, $scope.tokenInfo.decimals) + '' :
                        addressRow.data[1]
                };
            });


            contractService.loadAirdrop(contract.id, airdropAddresses).then(function(response) {
                contract.contract_details.added_count = airdropAddresses.length;
                contract.contract_details.all_count =
                    contract.contract_details.added_count +
                    contract.contract_details.processing_count +
                    contract.contract_details.sent_count;

                $scope.formWaiting = false;
                $scope.closeCurrentPopup();
            }, function(response) {
                switch (response.status) {
                    case 502:
                        $scope.saveAddressesError = true;
                        break;
                }
                $timeout(function() {
                    $scope.formWaiting = false;
                    $scope.$apply();
                    $scope.$parent.$broadcast('changeContent');
                });
            });
        });
    };

    /* Errors of CSV data displaying */
    var errorsScrollProgress = false;
    $scope.visibleErrors = [];
    var checkVisibleErrors = function(checkHeight) {
        if (errorsScrollProgress) return;
        if ($scope.visibleErrors.length === $scope.tableData.errors.length) return;
        var newPart = $scope.tableData.errors.slice($scope.visibleErrors.length, $scope.visibleErrors.length + visibleCountPlus);

        if (checkHeight) {
            $scope.visibleErrors = $scope.visibleErrors.concat(newPart);
        } else {
            $scope.visibleErrors = $scope.visibleErrors.concat(newPart);
            $scope.$apply();
        }
    };
    $scope.errorsListOptions = {
        parent: '.csv-errors-info--list',
        updater: checkVisibleErrors,
        offset: 140
    };
    $scope.openedErrors = false;
    $scope.openErrors = function(chapter) {
        $timeout(function() {
            $scope.openedErrors = !$scope.openedErrors;
            $scope.visibleErrors = [];
            if ($scope.openedErrors) {
                checkVisibleErrors(true);
            }
            $scope.$apply();
            $scope.$parent.$broadcast('changeContent');
        });
    };

}).controller('eosAirdropAddressesListPreview', function($scope, contractService, $timeout, FileSaver) {
    $scope.airdropAddressesList = [];
    var contract = $scope.ngPopUp.params.contract;
    var countLimit = 25;
    var page = 0;
    var filter = $scope.ngPopUp.params.filter;
    var getListPartProgress = false;
    var latestRequestResult;
    $scope.tokenInfo = $scope.ngPopUp.params.tokenInfo;
    var getNewPageAddresses = function() {
        if (getListPartProgress) return;

        if (latestRequestResult && ($scope.maxCount && ($scope.airdropAddressesList.length === $scope.maxCount))) {
            return;
        }

        if (latestRequestResult && (latestRequestResult.count === $scope.airdropAddressesList.length)) return;
        getListPartProgress = true;
        contractService.getEosAirdropAddresses(contract.id, {
            limit: countLimit,
            state: filter,
            offset: page * countLimit
        }).then(function(response) {
            latestRequestResult = response.data;
            getListPartProgress = false;
            page++;

            $timeout(function() {
                if ($scope.ngPopUp.params.maxCount) {
                    $scope.maxCount = Math.min($scope.ngPopUp.params.maxCount, response.data.count);
                }
                response.data.results.map(function(resultItem) {
                    resultItem.convertedAmount = new BigNumber(resultItem.amount).div(Math.pow(10, $scope.tokenInfo.decimals)).toString(10);
                });
                $scope.airdropAddressesList = $scope.airdropAddressesList.concat(response.data.results);
                $scope.$apply();
                $scope.$parent.$broadcast('changeContent');
            });

        });
    };
    getNewPageAddresses();
    $scope.addressesListOptions = {
        updater: getNewPageAddresses,
        parent: '.csv-addresses-table',
        offset: 150
    };
    $scope.saveAirdropAddress = function() {
        $timeout(function() {
            $scope.downloadProgress = true;
            $scope.$apply();
            $scope.$parent.$broadcast('changeContent');
            contractService.getEosAirdropAddresses(contract.id, {
                limit: latestRequestResult.count
            }).then(function(response) {
                var data = '';

                response.data.results.map(function(addressItem) {
                    data+= addressItem.address + ',' + addressItem.amount + "\n";
                });
                data = new Blob([data], { type: 'text/plain;charset=utf-8' });
                FileSaver.saveAs(data, contract.name + '(addresses).csv');
                $timeout(function() {
                    $scope.downloadProgress = false;
                    $scope.$apply();
                    $scope.$parent.$broadcast('changeContent');
                });
            });
        });
    };
}).controller('eosAirdropSendAddressesPreview', function($scope, contractService, $timeout, EOSService, FileSaver) {
    var countLimit = 100;
    var contract = $scope.contract = $scope.ngPopUp.params.contract;
    $scope.tokenInfo = $scope.ngPopUp.params.tokenInfo || false;
    var createContractAddressesInfo = function() {
        var allAmounts = new BigNumber(0);
        var decimalsValue = Math.pow(10, $scope.tokenInfo.decimals);

        contractService.getEosAirdropAddresses(contract.id, {
            limit: countLimit,
            state: 'added'
        }).then(function(response) {
            $scope.next_addresses = response.data.results;
            $scope.maxCount = Math.min(100, response.data.count);
            if ($scope.next_addresses.length) {
                $scope.next_addresses.map(function(address) {
                    allAmounts = allAmounts.plus(address.amount);
                    address.converted_amount = new BigNumber(address.amount).div(decimalsValue).toString(10)
                });
                $scope.totalAmount = allAmounts.toString(10);
                $scope.allAmounts = new BigNumber(allAmounts).div(decimalsValue).toString(10);

                $scope.airdrop_enabled = new BigNumber($scope.tokenInfo.balance).minus($scope.allAmounts) >= 0;
            }
            $timeout(function() {
                $scope.downloadProgress = false;
                $scope.$apply();
                $scope.$parent.$broadcast('changeContent');
            });
        });
    };
    createContractAddressesInfo();
    $scope.downloadProgress = true;
    $scope.saveAirdropAddress = function() {
        $timeout(function() {
            $scope.downloadProgress = true;
            $scope.$apply();
            $scope.$parent.$broadcast('changeContent');
            var data = '';
            $scope.next_addresses.map(function(addressItem) {
                data+= addressItem.address + ',' + addressItem.amount + "\n";
            });
            data = new Blob([data], { type: 'text/plain;charset=utf-8' });
            FileSaver.saveAs(data, contract.name + '(addresses).csv');
            $timeout(function() {
                $scope.downloadProgress = false;
                $scope.$apply();
                $scope.$parent.$broadcast('changeContent');
            });
        });
    };

    var airdropAccount = contract.contract_details.eos_contract.address;

    $scope.scatterNotInstalled = false;
    $scope.closeScatterAlert = function() {
        $scope.scatterNotInstalled = false;
        $scope.accountNotFinded = false;
        $scope.txServerError = false;
    };



    $scope.sendTransaction = function() {
        $scope.scatterNotInstalled = !EOSService.checkScatter();
        if ($scope.scatterNotInstalled) return;
        var airdropAddresses = [[], []];
        $scope.next_addresses.map(function(address) {
            airdropAddresses[0].push(address.address);
            airdropAddresses[1].push(address.amount);
        });

        EOSService.sendTx({
            actions: [{
                account: airdropAccount,
                name: 'drop',
                data: {
                    'addresses': airdropAddresses[0],
                    'amounts': airdropAddresses[1],
                    'pk': contract.id
                }
            }],
            owner: contract.contract_details.admin_address
        }).then(function(result) {
            $scope.successTx = result;
        }, function(error) {
            if (error.error) {
                console.log(JSON.parse(error.error));
            }
            switch(error.code) {
                case 1:
                    $scope.accountNotFinded = true;
                    break;
                case 2:
                    $scope.txServerError = true;
                    break;
            }
        });
    };
}).controller('eosAirdropDepositController', function($scope, EOSService) {
    var tokenInfo = $scope.ngPopUp.params.tokenInfo;
    var contract = $scope.contract = $scope.ngPopUp.params.contract;
    $scope.userBalance = 0;
    EOSService.getBalance(
        contract.contract_details.token_address,
        contract.contract_details.admin_address,
        tokenInfo.symbol,
        contract.network
    ).then(function(result) {
        $scope.userBalance = result[0] ? new BigNumber(result[0].split(' ')[0]).toString(10) : 0;
    });

    var airdropAccount = contract.contract_details.eos_contract.address;

    $scope.depositTokens = function(amount) {

        $scope.scatterNotInstalled = !EOSService.checkScatter();
        if ($scope.scatterNotInstalled) return;
        EOSService.sendTx({
            actions: [{
                account: contract.contract_details.token_address,
                name: 'transfer',
                data: {
                    to: airdropAccount,
                    quantity: new BigNumber(amount).toFormat(tokenInfo.decimals).toString(10).replace(/,/g, '') + ' ' + contract.contract_details.token_short_name,
                    memo: contract.id
                }
            }]
        }).then(function(result) {
            $scope.successTx = result;
        }, function(error) {
            switch(error.code) {
                case 1:
                    $scope.accountNotFinded = true;
                    break;
                case 2:
                    $scope.txServerError = true;
                    break;
            }
        });
    };

});
