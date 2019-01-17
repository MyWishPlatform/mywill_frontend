angular.module('app').controller('tronAirdropPreviewController', function($timeout, TronService, openedContract,
                                                                      $scope, contractService) {
    $scope.contract = openedContract.data;

    var checkContractPreview = function(withBalanceCheck) {
        $scope.iniContract($scope.contract);
        var details = $scope.contract.contract_details;
        details.all_count = details.added_count + details.processing_count + details.sent_count;

        if ($scope.contract.contract_details.tron_contract.address) {
            $scope.contract.contract_details.tron_contract.address =
                TronWeb.address.fromHex($scope.contract.contract_details.tron_contract.address)
        }

        if (withBalanceCheck) {
            TronService.getContract(
                details.token_address, $scope.contract.network
            ).then(function(contract) {
                TronService.checkToken(
                    contract, $scope.contract.network, details.tron_contract.address
                ).then(function(result) {
                    $scope.tokenInfo = result;
                    refreshContract();
                }, function() {
                    refreshContract();
                });
            });

        } else {
            refreshContract();
        }
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

    checkContractPreview(true);

    $scope.$on('$destroy', function() {
        if (timerContractUpdater) {
            $timeout.cancel(timerContractUpdater);
            timerContractUpdater = false;
        }
    });
}).controller('tronAirdropAddressesFormController', function($scope, Webworker, $timeout, contractService, $state, TronService) {

    /* Get token decimals */

    $scope.formWaiting = true;

    TronService.getContract(
        $scope.ngPopUp.params.contract.contract_details.token_address,
        $scope.ngPopUp.params.contract.network
    ).then(function(contract) {
        TronService.checkToken(
            contract,
            $scope.ngPopUp.params.contract.network
        ).then(function(result) {
            $timeout(function() {
                $scope.tokenInfo = result;
                $scope.formWaiting = false;
                $scope.$apply();
                $scope.$parent.$broadcast('changeContent');
            });
        });
    });

    $scope.csvFormat = {};
    var contract = $scope.ngPopUp.params.contract;
    var visibleCountPlus = 25;

    var fileFormats = ['text/csv', 'application/vnd.ms-excel', ''];

    // Check errors for values
    var parseDataForTable = function(results, csvFormat, decimals) {

        if (!results.data[results.data.length - 1][0]) {
            results.data = results.data.slice(0, results.data.length - 1);
        }
        var changeAmountParam = 0;
        if (!csvFormat.decimals) {
            changeAmountParam = decimals;
        }
        var errorsData = [], resultsData = [];

        results.data.forEach(function(row, index) {
            var resultRow = {
                data: row,
                line: index + 1
            };


            row[0] = row[0].replace(/^[\s]*([\S]+)[\s]*$/g, '$1');

            var address = row[0] = row[0].replace(/^[\s]*([\S]+)[\s]*$/g, '$1');
            var amount = row[1];



            if (!address) {
                resultRow.error = {
                    status: 1
                };
                errorsData.push(resultRow);
                return;
            }
            if (row[2] === 'INVALID_ADDRESS') {
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
            } else {
                var splittedAmount = amount.split('.');
                if (splittedAmount[1]) {
                    row[1] = amount = splittedAmount[0] + '.' + (splittedAmount[1].replace(/[0]+$/, ''));
                }
            }

            if ((amount.split('.')[1] || '').length > changeAmountParam) {
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

    var createResultData = function(csvData) {

        var myWorker = Webworker.create(parseDataForTable);

        console.log(csvData);
        csvData.data.forEach(function(row) {
            if (!TronWeb.isAddress(row[0])) {
                row[2] = 'INVALID_ADDRESS';
            }
        });

        myWorker.run(csvData, $scope.csvFormat, $scope.tokenInfo.decimals).then(function(result) {
            $timeout(function() {
                $scope.tableData = result;
                $scope.visibleAddresses = angular.copy($scope.tableData.results.slice(0, visibleCountPlus));
                convertAmount($scope.visibleAddresses);
                $scope.formWaiting = false;
                $scope.$apply();
                $scope.$parent.$broadcast('changeContent');
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
            /T[0-9a-z]{33}/ig.test(filecontent);
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
                partItem.data[2] = new BigNumber(partItem.data[1]).div(Math.pow(10, $scope.tokenInfo.decimals)).toString(10);
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
                        new BigNumber(addressRow.data[1]).times(Math.pow(10, $scope.tokenInfo.decimals)).toString(10) :
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

}).controller('sendTronAirdropController', function($scope, TronService) {
    var contractData = $scope.ngPopUp.params.contract;

    $scope.amount = $scope.ngPopUp.params.amount;
    $scope.tokenInfo = $scope.ngPopUp.params.tokenInfo;

    $scope.contract = contractData;

    var contractDetails = contractData.contract_details, contract;
    var params = [[], []];

    $scope.ngPopUp.params.next_addresses.map(function(address) {
        params[0].push(address.address.replace(/\s/g, ''));
        params[1].push(address.amount);
    });

    // var methodName = 'transfer';
    //
    // var interfaceMethod = web3Service.getMethodInterface(methodName, contractDetails.eth_contract.abi);
    // try {
    //     $scope.sendAirdropSignature = (new Web3()).eth.abi.encodeFunctionCall(interfaceMethod, params);
    // } catch(err) {
    //     console.log(err);
    // }

    // web3Service.getAccounts(contractData.network).then(function(result) {
    //     web3Service.setProviderByNumber(contractData.network);
    //     $scope.currentWallet = result.filter(function(wallet) {
    //         return wallet.wallet.toLowerCase() === contractDetails.admin_address.toLowerCase();
    //     })[0];
    //     if ($scope.currentWallet) {
    //         web3Service.setProvider($scope.currentWallet.type, contractData.network);
    //         contract = web3Service.createContractFromAbi(contractDetails.eth_contract.address, contractDetails.eth_contract.abi);
    //     }
    // });
    //
    // $scope.sendTransaction = function() {
    //     contract.methods[methodName](params[0], params[1]).send({
    //         from: $scope.currentWallet.wallet
    //     }).then(console.log);
    // };
}).controller('tronAirdropAddressesListPreview', function($scope, contractService, $timeout, FileSaver) {

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
        contractService.getAirdropAddresses(contract.id, {
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
                    resultItem.address = TronWeb.address.fromHex(resultItem.address);
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
            contractService.getAirdropAddresses(contract.id, {
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
}).controller('tronAirdropSendAddressesPreview', function($scope, contractService, $timeout, TronService, FileSaver) {
    var countLimit = 100;
    var contract = $scope.contract = $scope.ngPopUp.params.contract;
    $scope.tokenInfo = $scope.ngPopUp.params.tokenInfo || false;

    var createContractAddressesInfo = function() {
        var allAmounts = new BigNumber(0);
        var decimalsValue = Math.pow(10, $scope.tokenInfo.decimals);
        contractService.getAirdropAddresses(contract.id, {
            limit: countLimit,
            state: 'added'
        }).then(function(response) {
            $scope.next_addresses = response.data.results;
            $scope.maxCount = Math.min(100, response.data.count);
            if ($scope.next_addresses.length) {
                $scope.next_addresses.map(function(address) {
                    allAmounts = allAmounts.plus(address.amount);
                    address.converted_amount = new BigNumber(address.amount).div(decimalsValue).toString(10);
                    address.address = TronWeb.address.fromHex(address.address);
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


    $scope.downloadProgress = true;

    // if ($scope.tokenInfo) {
        createContractAddressesInfo();
    // } else {
    //     web3Service.getTokenInfo(
    //         contract.network,
    //         contract.contract_details.token_address,
    //         contract.contract_details.eth_contract.address
    //     ).then(function(result) {
    //         $scope.tokenInfo = result;
    //         createContractAddressesInfo();
    //     });
    // }

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

    $scope.closeExtensionAlert = function() {
        $scope.extensionNotInstalled =
            $scope.extensionNotAuthorized =
                $scope.extensionOtherUser =
                    $scope.successTx =
                        $scope.txServerError = false;
    };


    $scope.closeAirdropAddressesForm = function() {
        $scope.$parent.$broadcast('$closePopUps');
    };


    var airdropContract;

    TronService.createContract(
        contract.contract_details.tron_contract.abi,
        contract.contract_details.tron_contract.address,
        contract.network
    ).then(function(result) {
        airdropContract = result;
    });



    $scope.sendAirdropAddresses = function() {
        if (!window.tronWeb) {
            $scope.extensionNotInstalled = true;
            return;
        } else if (!window.tronWeb.defaultAddress) {
            $scope.extensionNotAuthorized = true;
            return;
        } else if (
            (window.tronWeb.defaultAddress.hex !== contract.contract_details.admin_address) &&
            (window.tronWeb.defaultAddress.base58 !== contract.contract_details.admin_address)) {
            $scope.extensionOtherUser = true;
            return;
        }

        var params = [[], []];

        $scope.next_addresses.map(function(address) {
            params[0].push(address.address.replace(/\s/g, ''));
            params[1].push(address.amount);
        });


        airdropContract.transfer(params[0], params[1]).send().then(function(response) {
            $scope.closeAirdropAddressesForm();
            $scope.successTx = {
                transaction_id: response
            };
            $scope.$apply();
        }, function(response) {
            $scope.txServerError = true;
            $scope.$apply();
        });
    };

});
