angular.module('app').controller('bnbAirdropPreviewController', function(
$timeout,
web3Service,
openedContract,
$scope,
contractService,
$rootScope
) {
    console.log('airdropPreviewController',$scope,$rootScope);
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
});
