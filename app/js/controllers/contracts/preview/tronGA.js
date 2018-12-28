angular.module('app').controller('tronGAPreviewController', function($timeout, $rootScope, contractService, $location,
                                                                    openedContract, $scope, $filter, TronService) {
    $scope.contract = openedContract.data;
    $scope.iniContract($scope.contract);
    var contractDetails = $scope.contract.contract_details;
    contractDetails.admin_address = TronWeb.address.fromHex(contractDetails.admin_address);

    $scope.blockchain = 'TRON';
    $scope.contractInfo = 'tron_contract_token';

    if (contractDetails.tron_contract_token.address) {
        contractDetails.tron_contract_token.address = TronWeb.address.fromHex(contractDetails.tron_contract_token.address);
    }

}).controller('tronGACreateAssetController', function($scope, TronService, $timeout) {
    var contract = $scope.contract = angular.copy($scope.ngPopUp.params.contract);

    var tokenContract;
    $scope.newToken = {};

    TronService.createContract(
        contract.contract_details.tron_contract_token.abi,
        contract.contract_details.tron_contract_token.address,
        contract.network
    ).then(function(result) {
        console.log(result);
        tokenContract = result;
    }, console.log);

    $scope.closeExtensionAlert = function() {
        $scope.extensionNotInstalled =
            $scope.extensionNotAuthorized =
                $scope.extensionOtherUser =
                    $scope.successTx =
                        $scope.txServerError = false;
    };


    $scope.closeForm = function() {
        $scope.$parent.$broadcast('$closePopUps');
    };

    var timerCheckTokenId, checkedId;
    $scope.checkTokenIdError = false;
    $scope.checkProgress = false;

    $scope.checkTokenId = function() {
        if (timerCheckTokenId) {
            $timeout.cancel(timerCheckTokenId);
        }
        $scope.checkProgress = true;
        $scope.checkTokenIdError = false;
        checkedId = $scope.newToken.tokenId;
        timerCheckTokenId = $timeout(function() {
            tokenContract.ownerOf($scope.newToken.tokenId).call().then(function() {
                if (checkedId != $scope.newToken.tokenId) return;
                $scope.checkTokenIdError = true;
                $scope.checkProgress = false;
                $scope.$apply();
            }, function() {
                $scope.checkProgress = false;
                $scope.$apply();
            });
        },  500)
    };

    $scope.sendTransaction = function() {

        if (!window.tronWeb) {
            $scope.extensionNotInstalled = true;
            return;
        } else if (!window.tronWeb.defaultAddress) {
            $scope.extensionNotAuthorized = true;
            return;
        } else if (
            (window.tronWeb.defaultAddress.hex !== contract.contract_details.admin_address) &&
            (window.tronWeb.defaultAddress.base58 !== contract.contract_details.admin_address)) {
            $scope.extensionOtherUser = true;
            return;
        }
        tokenContract.mint($scope.newToken.address, $scope.newToken.tokenId).send().then(function(response) {
            $scope.closeForm();
            $scope.successTx = {
                transaction_id: response
            };
            $scope.$apply();
        }, function(response) {
            $scope.txServerError = true;
            $scope.$apply();
        });
    };




}).controller('tronTokenMintController', function($scope, $timeout, APP_CONSTANTS, TronService, $filter) {

    var contract = $scope.contract = angular.copy($scope.ngPopUp.params.contract);

    var tokenContract;

    TronService.createContract(
        contract.contract_details.tron_contract_token.abi,
        contract.contract_details.tron_contract_token.address,
        contract.network
    ).then(function(result) {
        tokenContract = result;
        checkTotalSupply();
    });

    $scope.minStartDate = moment();
    contract.contract_details.token_holders = [];

    $scope.recipient = {
        freeze_date: $scope.minStartDate.clone().add(1, 'minutes')
    };

    $scope.chartOptions = {
        itemValue: 'amount',
        itemLabel: 'address'
    };


    var beforeDistributed = {
        amount: 0,
        address: $filter('translate')('POPUP_FORMS.MINT_TOKENS_FORM.CHART.DISTRIBUTED_BEFORE')
    };

    var chartData = [beforeDistributed];
    $scope.chartData = [];


    var totalSupply = {
        tokens: 0
    };

    $scope.closeExtensionAlert = function() {
        $scope.extensionNotInstalled =
            $scope.extensionNotAuthorized =
                $scope.extensionOtherUser =
                    $scope.successTx =
                        $scope.txServerError = false;
    };


    $scope.closeMintingForm = function() {
        $scope.$parent.$broadcast('$closePopUps');
    };


    var reGenerateChart = function() {
        console.log($scope.ngPopUp);
        if ($scope.ngPopUp.reGenerateChart) {
            $scope.ngPopUp.reGenerateChart();
        }
    };

    $scope.sendMintTransaction = function() {

        if (!window.tronWeb) {
            $scope.extensionNotInstalled = true;
            return;
        } else if (!window.tronWeb.defaultAddress) {
            $scope.extensionNotAuthorized = true;
            return;
        } else if (
            (window.tronWeb.defaultAddress.hex !== contract.contract_details.admin_address) &&
            (window.tronWeb.defaultAddress.base58 !== contract.contract_details.admin_address)) {
            $scope.extensionOtherUser = true;
            return;
        }


        var powerNumber = new BigNumber('10').toPower(contract.contract_details.decimals || 0);
        var amount = new BigNumber($scope.recipient.amount).times(powerNumber).toString(10);

        if ($scope.recipient.isFrozen) {
            tokenContract.mintAndFreeze(
                $scope.recipient.address,
                amount,
                $scope.recipient.freeze_date.format('X')
            ).send().then(function(response) {
                $scope.successTx = {
                    transaction_id: response
                };
                reGenerateChart();
                $scope.$apply();
            }, function() {
                $scope.txServerError = true;
                $scope.$apply();
            });
        } else {
            tokenContract.mint($scope.recipient.address, amount).send().then(function(response) {
                $scope.successTx = {
                    transaction_id: response
                };
                reGenerateChart();
                $scope.$apply();
            }, function(response) {
                $scope.txServerError = true;
                $scope.$apply();
            });
        }
    };

    $scope.checkTokensAmount = function() {
        $scope.chartData = angular.copy(chartData);
        $scope.totalSupply = angular.copy(totalSupply);
        if ($scope.mintForm && $scope.mintForm.$valid) {
            $scope.chartData.push($scope.recipient);
            $scope.totalSupply.tokens = $scope.totalSupply.tokens.plus($scope.recipient.amount);
        }
    };


    $scope.dataChanged = function() {
        $scope.chartOptions.updater ? $scope.chartOptions.updater() : false;
    };


    var checkTotalSupply = function() {
        if (!contract.contract_details.totalSupply) {
            tokenContract.totalSupply().call().then(function(result) {
                contract.contract_details.totalSupply =
                    new BigNumber(result._hex).div(Math.pow(10, contract.contract_details.decimals));

                totalSupply.tokens =
                    beforeDistributed.amount = contract.contract_details.totalSupply;

                $timeout(function() {
                    $scope.$apply();
                    $scope.checkTokensAmount();
                });
            });
        } else {
            totalSupply.tokens =
                beforeDistributed.amount = contract.contract_details.totalSupply;
            $scope.checkTokensAmount();
        }
    };

});
