angular.module('app').controller('airdropCreateController', function($scope, contractService, $timeout, $state, $rootScope, Webworker,
                                                                      CONTRACT_TYPES_CONSTANTS, openedContract, $stateParams, web3Service) {


    var contract = openedContract && openedContract.data ? openedContract.data : {
        name:  'MyAirdrop' + ($rootScope.currentUser.contracts + 1),
        contract_type: CONTRACT_TYPES_CONSTANTS.AIRDROP,
        network: $stateParams.network,
        contract_details: {
            decimals: true,
            airdrop_addresses: []
        }
    };
    $scope.network = contract.network;
    $scope.editContractMode = !!contract.id;
    var resetForm = function() {
        $scope.request = angular.copy(contract);
        $scope.tableData = {
            results: $scope.request.contract_details.airdrop_addresses.map(function(address) {
                return {
                    data: [address['address'], address['amount']]
                }
            })
        };
    };
    $scope.resetForms = resetForm;
    var contractInProgress = false;
    var storage = window.localStorage || {};
    $scope.createContract = function() {
        var isWaitingOfLogin = $scope.checkUserIsGhost();

        $scope.request.contract_details.airdrop_addresses = $scope.tableData.results.map(function(tableDataItem) {
            return {
                amount: tableDataItem.data[1],
                address: tableDataItem.data[0]
            };
        });

        if (!isWaitingOfLogin) {
            delete storage.draftContract;
            createContract();
            return;
        }

        storage.draftContract = JSON.stringify($scope.request);
        isWaitingOfLogin.then(function() {
            checkDraftContract(true)
        });
        return true;
    };
    var createContract = function() {
        if (contractInProgress) return;
        var data = angular.copy($scope.request);

        contractInProgress = true;
        contractService[!$scope.editContractMode ? 'createContract' : 'updateContract'](data).then(function(response) {
            $state.go('main.contracts.preview.byId', {id: response.data.id});
        }, function() {
            contractInProgress = false;
        });
    };
    var checkDraftContract = function(redirect) {
        if (localStorage.draftContract && !contract.id) {
            if (!contract.id) {
                var draftContract = JSON.parse(localStorage.draftContract);
                if (draftContract.contract_type == CONTRACT_TYPES_CONSTANTS.AIRDROP) {
                    contract = draftContract;
                }
            }
        }
        resetForm();
        if (localStorage.draftContract && !contract.id && !$rootScope.currentUser.is_ghost) {
            $scope.createContract();
        } else if (redirect && !localStorage.draftContract) {
            $state.go('main.contracts.list');
        }
    };
    checkDraftContract();


    var tableData;

    var parseDataForTable = function(results) {
        var addressRegExp = /^(0x)?[0-9a-f]{40}$/i;
        if (!results.data[results.data.length - 1][0]) {
            results.data = results.data.slice(0, results.data.length - 1);
        }
        return results.data.map(function(row, index) {
            var resultRow = {
                data: row,
                line: index
            };

            var address = row[0];
            var amount = row[1];

            if (!address) {
                resultRow.error = {
                    status: 1
                };
                return resultRow;
            }
            if (!amount || (amount == 0)) {
                resultRow.error = {
                    status: 3
                };
                return resultRow;
            }

            if (!addressRegExp.test(address)) {
                resultRow.error = {
                    status: 2
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
                var amountValueMod = tableDataItem.data[1]%1;
                if (amountValueMod > 0) {
                    tableDataItem.error = {
                        status: 5
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
            $scope.tableData = result;
            $scope.csvDataInitialize = false;
        });
    };

    var createResultData = function(csvData) {
        var myWorker = Webworker.create(parseDataForTable);
        myWorker.run(csvData).then(function(result) {
            tableData = result;
            parseDecimalsErrors();
        });
    };

    var fileFormats = ['text/csv', 'application/vnd.ms-excel'];
    var resetCSVData = function() {
        $scope.tableData = undefined;
        $scope.fileTypeError = false;
        $scope.fileParsingError = false;
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
        Papa.parse(file, {
            complete: createResultData,
            transform: function(value, cell) {
                if (cell === 1) {
                    if (!isNaN(value)) {
                        var n = new BigNumber(value);
                        if ($scope.request.contract_details.decimals) {
                            n = n.times(Math.pow(10, tokenContractDecimals));
                        }
                        return n.toString(10);
                    } else {
                        return undefined;
                    }
                }
                return value;
            },
            error: function(results, file) {
                console.log("Parsing error:", results);
                $scope.fileParsingError = true;
                $scope.csvDataInitialize = false;
                $scope.$apply();
            }
        });
        $scope.$apply();
    };

    $scope.$watch('request.contract_details.decimals', function(newValue, oldValue) {
        if (newValue == oldValue) return;
        resetCSVData();
    });

    web3Service.setProviderByNumber($scope.network);
    var web3 = web3Service.web3();
    var tokenContractDecimals = 0;


    $scope.checkTokenAddress = function(token_address) {
        tokenContractDecimals = false;
        $scope.checkedTokenAddress = false;
        token_address.$setValidity('contract-address', true);
        if (!$scope.request.contract_details.token_address || !web3.utils.isAddress($scope.request.contract_details.token_address.toLowerCase())) {
            return;
        }

        var address = web3.utils.toChecksumAddress($scope.request.contract_details.token_address);
        var web3Contract = web3Service.createContractFromAbi(address, window.abi);

        web3Contract.methods.name().call(console.log);
        web3Contract.methods.symbol().call(console.log);
        web3Contract.methods.totalSupply().call(console.log);
        web3Contract.methods.decimals().call(function(err, result) {
            if (err === null) {
                tokenContractDecimals = result;
                token_address.$setValidity('contract-address', true);
                $scope.checkedTokenAddress = true;
            } else {
                token_address.$setValidity('contract-address', false);
            }
            $scope.$apply();
        });
    };

    // $scope.checkTokenAddress($scope.tokenAddressForm.token_address);
});
