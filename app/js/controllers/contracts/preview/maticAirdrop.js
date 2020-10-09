angular.module('app').controller('maticAirdropPreviewController', function($timeout, web3Service, openedContract,
                                                                      $scope, contractService) {
    $scope.contract = openedContract.data;

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
});
