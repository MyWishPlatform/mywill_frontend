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

    var getAuthioCost = function () {
        contractService.getAuthioCost().then(function(response) {
            console.log('tokenPreviewController getAuthioCost',response);
            $scope.contract.authioPrices = {
                USDT: new BigNumber(response.data.USDT).div(10e5).toFixed(2).toString(10),
                WISH: new BigNumber(response.data.WISH).div(10e17).toFixed(2).toString(10),
                ETH: new BigNumber(response.data.ETH).div(10e17).toFixed(2).toString(10),
                BTC: new BigNumber(response.data.BTC).div(10e7).toFixed(2).toString(10),
            };
        });
    }
    getAuthioCost();

    var getVerificationStatus = function () {
        contractService.getContract($scope.contract.id).then(function(response) {
            console.log('moonriverPreviewController getVerificationStatus',response);
            $scope.contract.verification_status = response.data.contract_details.verification_status;
        });
    }
    getVerificationStatus();

    var getVerificationCost = function () {
        contractService.getVerificationCost().then(function(response) {
            console.log('moonriverPreviewController getVerificationCost',response);
            $scope.contract.verificationCost = {
                USDT: new BigNumber(response.data.USDT).div(10e5).toFixed(2).toString(10),
                WISH: new BigNumber(response.data.WISH).div(10e17).toFixed(2).toString(10),
                ETH: new BigNumber(response.data.ETH).div(10e17).toFixed(2).toString(10),
                BTC: new BigNumber(response.data.BTC).div(10e7).toFixed(2).toString(10),
            };
            console.log('moonriverPreviewController getVerificationStatus',$scope.contract);
        });
    }
    getVerificationCost();

    var getWhitelabelCost = function () {
        contractService.getWhitelabelCost().then(function(response) {
            // console.log('moonriverPreviewController getWhitelabelCost',response);
            $scope.contract.whitelabelCost = {
                USDT: new BigNumber(response.data.USDT).div(10e5).round(3).toString(10),
                WISH: new BigNumber(response.data.WISH).div(10e17).round(3).toString(10),
                ETH: new BigNumber(response.data.ETH).div(10e17).round(3).toString(10),
                BTC: new BigNumber(response.data.BTC).div(10e7).round(6).toString(10),
            };
        });
    }
    getWhitelabelCost();

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


    var powerNumber = new BigNumber('10').exponentiatedBy(contractDetails.decimals || 0);
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

});
