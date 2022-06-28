angular.module('app').controller('nearTokenPreviewController', function($timeout, $rootScope, contractService, $location,
                                                                          openedContract, $scope, $http) {


    $scope.contract = openedContract.data;
    var tokenTypes = {
        ERC20: 'NEP-141',
    };
    $scope.contract.contract_details.token_type = tokenTypes[$scope.contract.contract_details.token_type];
    $scope.iniContract($scope.contract);

    var contractDetails = $scope.contract.contract_details;
    var tabs = ['code', 'info'];


    var powerNumber = new BigNumber('10').exponentiatedBy(contractDetails.decimals || 0);
    var holdersSum = new BigNumber(0);

    var updateTotalSupply = function() {
        // $http.post('https://dev.mywish.io/api/v1/get_token_supply/', {'address': 'AWxHRKZBtrUcCCBMerotALNau73vAX84gBGJJjA4UA8i', network: 38 }, {
        //     headers: {
        //         'Content-Type': 'application/json'
        //     }
        // }).then(function (res) {
        //     $scope.chartData = angular.copy(contractDetails.token_holders);
        //     $scope.chartData.unshift({
        //         amount: new BigNumber(res.data.supply).minus(holdersSum).div(powerNumber),
        //         address: 'Other'
        //     });
        //     $scope.totalSupply = {
        //         tokens: new BigNumber(res.data.supply).div(powerNumber).toString(10)
        //     };
        //     console.log($scope.totalSupply);
        // })
        //     .catch(function (e) {
        //         console.error('Error from /api/v1/get_token_supply/', e);
        //     })
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
        tokens: contractDetails.maximum_supply
    };

    console.log('nearToken.js: $scope.chartData, $scope.totalSupply', $scope.chartData, $scope.totalSupply);
    console.log('nearToken.js: contractDetails', contractDetails)
    console.log('nearToken.js: contractDetails.token_holders', contractDetails.token_holders)

    switch ($scope.contract.network) {
        case 40:
            $scope.blockchain = 'NEAR';
            $scope.contractInfo = 'near_contract_token';
            break;
    }

    $rootScope.contract = $scope.contract
});
