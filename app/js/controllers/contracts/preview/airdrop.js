angular.module('app').controller('airdropPreviewController', function($timeout, web3Service, openedContract,
                                                                      $scope, $rootScope, contractService, $http) {
    $scope.contract = openedContract.data;
    $scope.setContract($scope.contract);

    web3Service.setProviderByNumber($scope.contract.network);

    var countLimit = 100;

    $scope.allAmounts = new BigNumber(0);

    var createContractAddressesInfo = function() {
        var allAddressesCount = $scope.contract.contract_details.added_count +
            $scope.contract.contract_details.processing_count +
            $scope.contract.contract_details.sent_count;

        $scope.contract.airdropState = {
            allAddresses: allAddressesCount,
            allRequestsCount: Math.ceil(allAddressesCount / countLimit),
            nextRequest: Math.ceil($scope.contract.contract_details.sent_count / countLimit) + 1
        };
        contractService.getAirdropAddresses($scope.contract.id, {
            limit: countLimit,
            state: 'added'
        }).then(function(response) {
            $scope.contract.contract_details.next_addresses = response.data.results;
            if ($scope.contract.contract_details.next_addresses.length) {
                $scope.contract.contract_details.next_addresses.map(function(address) {
                    $scope.allAmounts = $scope.allAmounts.plus(address.amount);
                });
            }
            getAllTokensInfo();
        });
    };
    $scope.updateBalanceInfo = createContractAddressesInfo;

    createContractAddressesInfo();

    var requestsCount = 0;
    var tokenInfoFields = ['decimals', 'symbol', 'balanceOf'];

    $scope.tokenInfo = {};

    var getTokenParamCallback = function(err, result, method) {
        requestsCount++;
        $scope.tokenInfo[method] = result;
        if (requestsCount === tokenInfoFields.length) {
            var decimalsValue = Math.pow(10, $scope.tokenInfo.decimals);
            $scope.tokenInfo.balance = new BigNumber($scope.tokenInfo.balanceOf);
            if ($scope.contract.contract_details.next_addresses.length) {
                $scope.contract.airdrop_enabled = $scope.tokenInfo.balance.minus($scope.allAmounts) > 0;
            }
            $scope.tokenInfo.balance = $scope.tokenInfo.balance.div(decimalsValue).round(2).toString(10);
            $scope.allAmounts = $scope.allAmounts.div(decimalsValue).round(2).toString(10);
        }
        $scope.$apply();
    };

    var getAllTokensInfo = function() {
        var web3Contract = web3Service.createContractFromAbi($scope.contract.contract_details.token_address, window.abi);
        tokenInfoFields.map(function(method) {
            switch (method) {
                case 'balanceOf':
                    web3Contract.methods[method]($scope.contract.contract_details.eth_contract.address).call(function(err, result) {
                        getTokenParamCallback(err, result, method);
                    });
                    break;
                default:
                    web3Contract.methods[method]().call(function(err, result) {
                        getTokenParamCallback(err, result, method);
                    });
            }
        });
    };


}).controller('airdropAddressesFormController', function($scope, Webworker, $timeout, contractService, $state) {
    $scope.csvFormat = {};
    var contract = $scope.ngPopUp.params.contract;
    var visibleCountPlus = 25;
    var parseDataForTable = function(results) {
        var addressRegExp = /^(0x)?[0-9a-f]{40}$/i;
        if (!results.data[results.data.length - 1][0]) {
            results.data = results.data.slice(0, results.data.length - 1);
        }

        return results.data.map(function(row, index) {
            var resultRow = {
                data: row,
                line: index + 1
            };

            var address = row[0];
            var amount = row[1];

            if (!address) {
                resultRow.error = {
                    status: 1
                };
                return resultRow;
            }

            if (!addressRegExp.test(address)) {
                resultRow.error = {
                    status: 2
                };
                return resultRow;
            }

            if (!amount || isNaN(amount)) {
                resultRow.error = {
                    status: 3
                };
                return resultRow;
            }

            return resultRow;
        });
    };
    var parseDecimalsErrors = function() {
        var myWorker = Webworker.create(function(tableData) {
            var result = tableData.map(function(tableDataItem) {
                if (tableDataItem.error) return tableDataItem;
                var amountValueMod = tableDataItem.data[3]%1;
                if (amountValueMod > 0) {
                    tableDataItem.error = {
                        status: 4
                    };
                }
                return tableDataItem;
            });
            return {
                errors: result.filter(function (itemRow) {
                    return !!itemRow.error;
                }),
                results: result.filter(function (itemRow) {
                    return !itemRow.error;
                })
            }
        });

        myWorker.run(tableData).then(function(result) {
            $timeout(function() {
                $scope.tableData = result;
                $scope.visibleAddresses = angular.copy($scope.tableData.results.slice(0, visibleCountPlus));
                convertAmount($scope.visibleAddresses);
                $scope.csvDataInitialize = false;
                $scope.$apply();
                $scope.$parent.$broadcast('changeContent');
            });
        });
    };
    var tableData;
    var createResultData = function(csvData) {
        var myWorker = Webworker.create(parseDataForTable);
        myWorker.run(csvData).then(function(result) {
            tableData = result;
            parseDecimalsErrors();
        });
    };
    var fileFormats = ['text/csv', 'application/vnd.ms-excel', ''];
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
    $scope.changeFile = function(fileInput) {
        resetCSVData();
        var file = fileInput.files[0];
        if (fileFormats.indexOf(file.type) === -1) {
            $scope.fileTypeError = true;
            $scope.$apply();
            return;
        }
        $scope.csvDataInitialize = true;
        $scope.$apply();
        $scope.$parent.$broadcast('changeContent');
        Papa.parse(file, {
            complete: createResultData,
            error: function(results, file) {
                console.log("Parsing error:", results);
                $scope.fileParsingError = true;
                $scope.csvDataInitialize = false;
                $scope.$apply();
                $scope.$parent.$broadcast('changeContent');
            }
        });
        $scope.$apply();
    };

    /* Get token decimals */

    var tokenContractDecimals = $scope.ngPopUp.params.tokenInfo.decimals;
    $scope.tokenSymbol = $scope.ngPopUp.params.tokenInfo.symbol;

    var addressesScrollProgress = false;
    var convertAmount = function(part) {
        part.map(function(partItem) {
            if ($scope.csvFormat.decimals) {
                partItem.data[2] = new BigNumber(partItem.data[1]).div(Math.pow(10, tokenContractDecimals)).toString(10);
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
    $scope.uploadAddressesProgress = false;
    $scope.addAddresses = function() {
        if ($scope.uploadAddressesProgress) return;
        $scope.uploadAddressesProgress = true;
        var airdropAddresses = $scope.tableData.results.map(function(addressRow) {
            return {
                address: addressRow.data[0],
                amount: addressRow.data[1]
            };
        });
        contractService.loadAirdrop(contract.id, airdropAddresses).then(function() {
            contract.contract_details.added_count+= airdropAddresses.length;
            $scope.uploadAddressesProgress = false;
            $scope.ngPopUp.actions.updateBalanceInfo();
            $scope.closeCurrentPopup();
        }, function() {
            $scope.uploadAddressesProgress = false;
        });
    }


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

}).controller('sendAirdropController', function($scope, web3Service, $rootScope) {
    var contractData = $scope.ngPopUp.params.contract;

    $scope.contract = contractData;
    web3Service.setProviderByNumber(contractData.network);

    var contractDetails = contractData.contract_details, contract;
    var params = [[], []];

    contractDetails.next_addresses.map(function(address) {
        params[0].push(address.address);
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
});
