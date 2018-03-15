angular.module('app').controller('tokenCreateController', function($scope, contractService, $timeout, $state, $rootScope,
                                                                      CONTRACT_TYPES_CONSTANTS, openedContract) {

    var contract = openedContract && openedContract.data ? openedContract.data : {
        contract_details: {
            token_holders: [{}],
            token_type: 'ERC20'
        }
    };

    $scope.minStartDate = moment();
    $scope.dates = {
        startDate: $scope.editContractMode ? moment(contract.contract_details.start_date * 1000) : $scope.minStartDate.clone().add(1, 'days'),
        endDate: $scope.editContractMode ? moment(contract.contract_details.stop_date * 1000) : $scope.minStartDate.clone().add(1, 'days').add(1, 'months')
    };

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
        $scope.tokensAmountError = (holdersSum.toString(10) == 0) || isNaN(stringValue);
        if (!$scope.tokensAmountError) {
            $scope.totalSupply = {
                tokens: holdersSum.round(2).toString(10)
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
        $scope.chartOptions.updater ? $scope.chartOptions.updater() : false;
    };

    $scope.onChangeDateOfRecipient = function(path, value) {
        $scope.token_holders.filter(function(holder) {
            return holder.freeze_date === value;
        })[0]['parsed_freeze_date'] = value.format('X') * 1;
    };

    $scope.resetFormData = function() {
        $scope.request = angular.copy(contract.contract_details);
        $scope.contractName = contract.name;
        $scope.minStartDate = moment();
        $scope.token_holders = angular.copy($scope.request.token_holders);
        var powerNumber = new BigNumber('10').toPower($scope.request.decimals || 0);
        $scope.token_holders.map(function(holder) {
            holder.isFrozen = !!holder.freeze_date;
            holder.freeze_date = holder.freeze_date ? moment(holder.freeze_date * 1000) : $scope.dates.endDate;
            if (holder.amount) {
                holder.amount = new BigNumber(holder.amount).div(powerNumber).toString(10);
            }
            holder.parsed_freeze_date = holder.freeze_date.format('X') * 1;
        });
    };
    $scope.resetFormData();
    $scope.checkTokensAmount();


    $scope.createContract = function() {
        var isWaitingOfLogin = $scope.checkUserIsGhost();
        if (!isWaitingOfLogin) {
            createContract();
            return;
        }
        isWaitingOfLogin.then($scope.createContract);
        return true;
    };

    /* Управление датой и временем начала/окончания ICO (end) */
    var contractInProgress = false;
    var createContract = function() {
        if (contractInProgress) return;

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

        var contractDetails = angular.copy($scope.request);
        contractDetails.decimals = contractDetails.decimals * 1;

        var data = {
            name: $scope.request.token_name,
            contract_type: CONTRACT_TYPES_CONSTANTS.TOKEN,
            contract_details: contractDetails,
            id: contract.id
        };
        contractInProgress = true;
        contractService[!contract.id ? 'createContract' : 'updateContract'](data).then(function(response) {
            contractInProgress = false;
            $state.go('main.contracts.preview.byId', {id: response.data.id});
        }, function(data) {
            console.log(data);
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


});
