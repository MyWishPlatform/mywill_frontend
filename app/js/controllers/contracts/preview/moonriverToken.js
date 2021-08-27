angular.module('app').controller('moonriverTokenPreviewController', function($timeout, $rootScope, contractService, $location,
                                                                             openedContract, $scope, $filter, web3Service) {


    $scope.contract = openedContract.data;
    var tokenTypes = {
        ERC20: 'ERC20',
        ERC223: 'ERC223',
    };
    $scope.contract.contract_details.token_type = tokenTypes[$scope.contract.contract_details.token_type];


    $scope.iniContract($scope.contract);

    var contractDetails = $scope.contract.contract_details, web3Contract;


    var tabs = ['code', 'info'];


    var updateTotalSupply = function() {
        web3Contract.methods.totalSupply().call(function(error, result) {
            if (error) {
                result = 0;
            }
            $scope.chartData = angular.copy(contractDetails.token_holders);
            $scope.chartData.unshift({
                amount: new BigNumber(result).minus(holdersSum).div(powerNumber),
                address: 'Other'
            });
            $scope.totalSupply = {
                tokens: new BigNumber(result).div(powerNumber)
            };
            $scope.$apply();
        });
    };


    var powerNumber = new BigNumber('10').toPower(contractDetails.decimals || 0);
    var holdersSum = new BigNumber(0);

    contractDetails.token_holders.map(function(holder) {
        holdersSum = holdersSum.plus(holder.amount);
        holder.amount = new BigNumber(holder.amount).div(powerNumber).toString(10);
    });


    if (contractDetails.eth_contract_token && contractDetails.eth_contract_token.address) {
        web3Service.setProviderByNumber($scope.contract.network);
        web3Contract = web3Service.createContractFromAbi(
            contractDetails.eth_contract_token.address,
            contractDetails.eth_contract_token.abi
        );

        if (web3Contract.methods.freezingBalanceOf) {
            web3Contract.methods.freezingBalanceOf(contractDetails.admin_address).call(function(error, result) {
                if (error) return;
                if (result * 1) {
                    $scope.tokensFreezed = true;
                }
                $scope.$apply();
            });
        }
        updateTotalSupply();
    } else {
        $scope.chartData = angular.copy(contractDetails.token_holders);
    }

    $scope.chartOptions = {
        itemValue: 'amount',
        itemLabel: 'address'
    };

    $scope.forMintInfo = {
        updateData: updateTotalSupply
    };


    if ($location.$$hash && (/^tab-.+/.test($location.$$hash))) {
        var tab = $location.$$hash.replace(/^tab-(.+$)/, '$1');
        if (tabs.indexOf(tab) !== -1) {
            $scope.$parent.showedTab = tab;
        }
    }


    switch ($scope.contract.network) {
        case 37:
            $scope.blockchain = 'MOONRIVER';
            $scope.contractInfo = 'eth_contract_token';
            break;
    }
});
