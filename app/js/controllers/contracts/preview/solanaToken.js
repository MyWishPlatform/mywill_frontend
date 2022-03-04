angular.module('app').controller('solanaTokenPreviewController', function($timeout, $rootScope, contractService, $location,
                                                                             openedContract, $scope, $filter, web3Service, $http, $stateParams) {


    $scope.contract = openedContract.data;
    var tokenTypes = {
        ERC20: 'SPL',
        ERC223: 'SPL',
    };
    $scope.contract.contract_details.token_type = tokenTypes[$scope.contract.contract_details.token_type];
    $scope.iniContract($scope.contract);

    var contractDetails = $scope.contract.contract_details;
    var tabs = ['code', 'info'];

    console.log(77, $scope.contract.contract_details);
    console.log(11,  $stateParams);

    var powerNumber = new BigNumber('10').exponentiatedBy(contractDetails.decimals || 0);
    var holdersSum = new BigNumber(0);

    var updateTotalSupply = function() {
        console.log(999);
        $http.post('https://dev.mywish.io/api/v1/get_token_supply/', {'address': 'AWxHRKZBtrUcCCBMerotALNau73vAX84gBGJJjA4UA8i', network: 38 }, {
            headers: {
                'Content-Type': 'application/json'
            }
        }).then(function (res) {
            $scope.chartData = angular.copy(contractDetails.token_holders);
            $scope.chartData.unshift({
                amount: new BigNumber(res.data.supply).minus(holdersSum).div(powerNumber),
                address: 'Other'
            });
            $scope.totalSupply = {
                            tokens: new BigNumber(res.data.supply).div(powerNumber).toString(10)
                        };
            console.log(888, $scope.totalSupply);
        })
            .catch(function (e) {
                console.error('Error from /api/v1/get_token_supply/', e);
            })
    }

    contractDetails.token_holders.map(function(holder) {
        holdersSum = holdersSum.plus(holder.amount);
        holder.amount = new BigNumber(holder.amount).div(powerNumber).toString(10);
    });

    $scope.chartData = angular.copy(contractDetails.token_holders);
    $scope.chartOptions = {
        itemValue: 'amount',
        itemLabel: 'address'
    };
    $scope.totalSupply = {
        tokens: holdersSum.div(powerNumber).toString(10)
    };

    console.log(999, $scope.chartData, $scope.totalSupply);

    console.log(contractDetails.token_holders);

    switch ($scope.contract.network) {
        case 38:
        case 39:
            $scope.blockchain = 'SOLANA';
            $scope.contractInfo = 'solana_contract_token';
            break;
    }

    $rootScope.contract = $scope.contract
});
