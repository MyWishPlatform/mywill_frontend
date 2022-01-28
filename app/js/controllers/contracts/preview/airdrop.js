angular.module('app').controller('airdropPreviewController', function(
$timeout,
web3Service,
openedContract,
$scope,
contractService,
$rootScope
) {
    // console.log('airdropPreviewController',$scope,$rootScope);
    $scope.contract = openedContract.data;

    var getVerificationStatus = function () {
        contractService.getContract($scope.contract.id).then(function(response) {
            console.log('airdropPreviewController getVerificationStatus',response);
            $scope.contract.verification_status = response.data.contract_details.verification_status;
        });
    }
    getVerificationStatus();

    var getVerificationCost = function () {
        contractService.getVerificationCost().then(function(response) {
            console.log('airdropPreviewController getVerificationCost',response);
            $scope.contract.verificationCost = {
                USDT: new BigNumber(response.data.USDT).div(10e5).decimalPlaces(3).toString(10),
                WISH: new BigNumber(response.data.WISH).div(10e17).decimalPlaces(3).toString(10),
                ETH: new BigNumber(response.data.ETH).div(10e17).decimalPlaces(3).toString(10),
                BTC: new BigNumber(response.data.BTC).div(10e7).decimalPlaces(6).toString(10),
            };
        });
    }
    getVerificationCost();

    var checkContractPreview = function(withBalanceCheck) {
        $scope.iniContract($scope.contract);
        var details = $scope.contract.contract_details;
        details.all_count = details.added_count + details.processing_count + details.sent_count;

        if (withBalanceCheck) {
            web3Service.getTokenInfo(
                $scope.contract.network,
                $scope.contract.contract_details.token_address,
                $scope.contract.contract_details.eth_contract.address,
                ['balanceOf', 'decimals']
            ).then(function(result) {
                for (var i in result) {
                    $scope.tokenInfo[i] = result[i];
                }
                refreshContract();
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


    checkContractPreview();

    var fieldsParams = ['decimals', 'symbol'];

    if ($scope.contract.stateValue >= 4) {
        fieldsParams = false;
    }
    web3Service.getTokenInfo(
        $scope.contract.network,
        $scope.contract.contract_details.token_address,
        $scope.contract.contract_details.eth_contract.address,
        fieldsParams
    ).then(function(result) {
        $scope.tokenInfo = result;
    });

    $scope.$on('$destroy', function() {
        if (timerContractUpdater) {
            $timeout.cancel(timerContractUpdater);
            timerContractUpdater = false;
        }
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
}).controller('airdropAddressesFormController', function($scope, Webworker, $timeout, contractService, $state, web3Service) {

    /* Get token decimals */

    $scope.formWaiting = true;

    web3Service.getTokenInfo(
        $scope.ngPopUp.params.contract.network,
        $scope.ngPopUp.params.contract.contract_details.token_address
    ).then(function(result) {
        $timeout(function() {
            $scope.tokenInfo = result;
            $scope.formWaiting = false;
            $scope.$apply();
            $scope.$parent.$broadcast('changeContent');
        });
    });

    $scope.csvFormat = {};
    var contract = $scope.ngPopUp.params.contract;
    var visibleCountPlus = 25;

    var fileFormats = ['text/csv', 'application/vnd.ms-excel', ''];

    // Check errors for values
    var parseDataForTable = function(results, csvFormat, decimals) {
        var addressRegExp = /^0x[0-9a-f]{40}$/i;
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
            if ((amount * changeAmountParam) % 1 > 0) {
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
            /(0x)?[0-9a-f]{40}/ig.test(filecontent);
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
                $scope.formWaiting = false;
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

}).controller('sendAirdropController', function($scope, web3Service) {
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

    var methodName = 'transfer';

    var interfaceMethod = web3Service.getMethodInterface(methodName, contractDetails.eth_contract.abi);
    try {
        $scope.sendAirdropSignature = (new Web3()).eth.abi.encodeFunctionCall(interfaceMethod, params);
    } catch(err) {
        console.log(err);
    }

    web3Service.getAccounts(contractData.network).then(function(result) {
        web3Service.setProviderByNumber(contractData.network);
        $scope.currentWallet = result.filter(function(wallet) {
            return wallet.wallet.toLowerCase() === contractDetails.admin_address.toLowerCase();
        })[0];
        if ($scope.currentWallet) {
            web3Service.setProvider($scope.currentWallet.type, contractData.network);
            contract = web3Service.createContractFromAbi(contractDetails.eth_contract.address, contractDetails.eth_contract.abi);
        }
    });

    $scope.sendTransaction = function() {
        contract.methods[methodName](params[0], params[1]).send({
            from: $scope.currentWallet.wallet
        }).then(console.log);
    };
}).controller('airdropAddressesListPreview', function($scope, contractService, $timeout, FileSaver) {

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
}).controller('airdropSendAddressesPreview', function($scope, contractService, $timeout, web3Service, FileSaver) {
    var countLimit = 100;
    var contract = $scope.ngPopUp.params.contract;
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


    $scope.downloadProgress = true;

    if ($scope.tokenInfo) {
        createContractAddressesInfo();
    } else {
        web3Service.getTokenInfo(
            contract.network,
            contract.contract_details.token_address,
            contract.contract_details.eth_contract.address
        ).then(function(result) {
            $scope.tokenInfo = result;
            createContractAddressesInfo();
        });
    }

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

}).controller('airdropWithdrawController', function($scope, web3Service, $timeout){


    var contract = angular.copy($scope.ngPopUp.params.contract);
    $scope.contract = contract;

    web3Service.setProviderByNumber(contract.network);
    var web3Contract;

    web3Service.getAccounts(contract.network).then(function(result) {
        $scope.currentWallet = result.filter(function(wallet) {
            return wallet.wallet.toLowerCase() === contract.contract_details.admin_address.toLowerCase();
        })[0];

        if ($scope.currentWallet) {
            web3Service.setProvider($scope.currentWallet.type, contract.network);
        }

        web3Contract = web3Service.createContractFromAbi(
            contract.contract_details.eth_contract.address,
            contract.contract_details.eth_contract.abi
        );

        $timeout(function() {
            $scope.$apply();
        });
    });

    $scope.dataField = {
        address: contract.contract_details.token_address
    };


    $scope.checkAirdropToken = function() {
        $scope.tokenInfo = {};
        if (!$scope.dataField.address) return;
        web3Service.getTokenInfo(
            contract.network,
            $scope.dataField.address,
            contract.contract_details.eth_contract.address,
            ['balanceOf', 'decimals']
        ).then(function(result) {
            for (var i in result) {
                $scope.tokenInfo[i] = result[i];
            }
            $scope.tokenInfo['balanceOf'] = $scope.tokenInfo['balanceOf'] || 0;
            $scope.dataField['amount'] = new BigNumber($scope.tokenInfo['balanceOf']).div(Math.pow(10, $scope.tokenInfo['decimals']));
        });
    };

    $scope.tokenInfo = {
        address: $scope.contract.contract_details.token_address
    };

    $scope.withdrawSignature = {};
    $scope.checkAirdropToken();

    $scope.generateSignature = function() {
        var powerNumber = new BigNumber('10').exponentiatedBy($scope.tokenInfo.decimals || 0);
        var amount = new BigNumber($scope.dataField.amount).times(powerNumber).toString(10);
        var params = [$scope.dataField.address, amount];

        var withdrawInterfaceMethod = web3Service.getMethodInterface('withdrawToken', contract.contract_details.eth_contract.abi);

        $scope.withdrawSignature.string = (new Web3()).eth.abi.encodeFunctionCall(
            withdrawInterfaceMethod, params
        );
    };

    $scope.sendWithdrawTransaction = function() {
        var powerNumber = new BigNumber('10').exponentiatedBy($scope.tokenInfo.decimals || 0);
        var amount = new BigNumber($scope.dataField.amount).times(powerNumber).toString(10);

        web3Contract.methods.withdrawToken($scope.dataField.address, amount).send({
            from: $scope.currentWallet.wallet
        }).then(console.log);
    };


});
