angular.module('app').controller('airdropCreateController', function($scope, contractService, $timeout, $state, $rootScope,
                                                                      CONTRACT_TYPES_CONSTANTS, openedContract, $stateParams, web3Service) {


    var contract = openedContract && openedContract.data ? openedContract.data : {
        name:  'MyAirdrop' + ($rootScope.currentUser.contracts + 1),
        contract_type: CONTRACT_TYPES_CONSTANTS.DEFERRED,
        network: $stateParams.network,
        contract_details: {}
    };
    $scope.network = contract.network;
    $scope.editContractMode = !!contract.id;

    var resetForm = function() {
        $scope.request = angular.copy(contract);
    };

    $scope.resetForms = resetForm;

    var contractInProgress = false;

    var storage = window.localStorage || {};
    $scope.createContract = function() {
        var isWaitingOfLogin = $scope.checkUserIsGhost();
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
                if (draftContract.contract_type == CONTRACT_TYPES_CONSTANTS.DEFERRED) {
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

    var parseDataForTable = function(results) {
        var parsedData = [];
        var errors = [];
        var lastParsedRow = 0;
        if (!results.data[results.data.length - 1][0]) {
            results.data = results.data.slice(0, results.data.length - 1);
        }

        while (lastParsedRow < results.data.length) {
            var index = lastParsedRow;
            var row = results.data[index];
            lastParsedRow++;
            var address = row[0];
            if (!address) {
                errors.push({
                    status: 4,
                    row: index + 1,
                    type: 'error'
                });
                continue;
            }

            var amount = row[1] ? row[1].replace(/[\s,]/g,'') : undefined;
            if (!amount || (amount == 0)) {
                errors.push({
                    status: 5,
                    row: index + 1,
                    type: 'error'
                });
                continue;
            }
            if (isNaN(amount)) {
                errors.push({
                    status: 6,
                    row: index + 1,
                    type: 'error',
                    value: amount
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

    var createResultData = function(csvData) {
        $scope.tableData = parseDataForTable(csvData);
        console.log($scope.tableData);
        // checkVisibleErrors();
        // checkVisibleWarnings();
        // $scope.visibleAddresses = $scope.tableData.result.slice(0, visibleCountPlus);
        $scope.$apply();
    };

    var fileFormats = ['text/csv', 'application/vnd.ms-excel'];
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


    web3Service.setProviderByNumber($scope.network);
    var web3 = web3Service.web3();
    var tokenContractDecimals = false;


    $scope.checkTokenAddress = function(token_address) {
        tokenContractDecimals = false;
        $scope.checkedTokenAddress = false;
        token_address.$setValidity('contract-address', true);
        if (!$scope.request.contract_details.token_address || !web3.utils.isAddress($scope.request.contract_details.token_address.toLowerCase())) {
            return;
        }
        var address = web3.utils.toChecksumAddress($scope.request.contract_details.token_address);
        var web3Contract = web3Service.createContractFromAbi(address, window.abi);

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

});
