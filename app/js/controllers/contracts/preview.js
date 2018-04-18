angular.module('app').controller('contractsPreviewController', function($state, $scope, contractService, $rootScope, NETWORKS_TYPES_NAMES_CONSTANTS,
                                                                        $timeout, CONTRACT_STATUSES_CONSTANTS, FileSaver, web3Service) {
    var deletingProgress = false;
    $scope.statuses = CONTRACT_STATUSES_CONSTANTS;
    $scope.contract = false;

    $scope.selectedContract = false;
    $scope.showedTab = 'info';

    $scope.goTo = function(tab, contractType) {
        $scope.showedTab = tab;
        $scope.selectedContract = contractType;
    };

    $scope.saveAsFile = function(data, name) {
        data = new Blob([data], { type: 'text/plain;charset=utf-8' });
        FileSaver.saveAs(data, name + '.sol');
    };

    var url = 'https://www.myetherwallet.com/?';
    var params = [
        'sendMode=ether'
    ];
    var depositUrl = url + params.join('&');
    var killUrl = url + params.join('&');

    var originalCost;

    $scope.setContract = function(contract) {
        $scope.contract = contract;
        $scope.contract.stateValue = $scope.statuses[$scope.contract.state]['value'];
        $scope.contract.stateTitle = $scope.statuses[$scope.contract.state]['title'];
        $scope.contract.networkName = NETWORKS_TYPES_NAMES_CONSTANTS[$scope.contract.network || 1];
        contract.balance = undefined;
        $scope.contract.discount = 0;

        if (!contract.contract_details.eth_contract) return;
        var depositParams = ['to=' + contract.contract_details.eth_contract.address, 'gaslimit=30000', 'value=0'];
        var killParams = ['to=' + contract.contract_details.eth_contract.address, 'data=0x41c0e1b5', 'gaslimit=40000', 'value=0'];
        contract.depositUrl = depositUrl + '&' + depositParams.join('&');
        contract.killUrl = killUrl + '&' + killParams.join('&');

        contract.currency = ((contract.network == 1) || (contract.network == 2)) ? 'ETH' :
            ((contract.network == 3) || (contract.network == 4)) ? 'SBTC' : 'Unknown';

        $scope.networkName = contract.currency;

        web3Service.setProviderByNumber(contract.network);

        if (contract.contract_details.eth_contract.address) {
            web3Service.getBalance(contract.contract_details.eth_contract.address).then(function(result) {
                contract.balance = Web3.utils.fromWei(result, 'ether');
            });
        }
    };

    $scope.deleteContract = function() {
        deletingProgress = true;
        contractService.deleteContract($scope.contract.id).then(function() {
            deletingProgress = false;
            $state.go('main.contracts.list');
        }, function() {
            deletingProgress = false;
        });
    };


    $scope.successCodeCopy = function(contract, field) {
        contract.copied = contract.copied || {};
        contract.copied[field] = true;
        $timeout(function() {
            contract.copied[field] = false;
        }, 1000);
    };

    var launchProgress = false;
    var launchContract = function(contract) {
        launchProgress = true;
        $rootScope.commonOpenedPopup = false;
        contractService.deployContract(contract.id, contract.promo).then(function() {
            launchProgress = false;
            dataLayer.push({'event': 'contract_launch_success'});
            $state.go('main.contracts.list');
        }, function(data) {
            console.log(data);
            switch(data.status) {
                case 400:
                    switch(data.data.result) {
                        case '1':
                        case 1:
                            $rootScope.commonOpenedPopup = 'contract_date_incorrect';
                            break;
                        case '2':
                        case 2:
                            $rootScope.commonOpenedPopup = 'contract_freeze_date_incorrect';
                            break;
                    }
                    break;
            }
            launchProgress = false;
        });
    };

    var showPriceLaunchContract = function(contract) {

        if (contract.cost.WISH == 0) {
            launchContract(contract);
            return;
        }
        $rootScope.commonOpenedPopup = 'contract-confirm-pay';
        $rootScope.commonOpenedPopupParams = {
            class: 'deleting-contract',
            contract: contract,
            confirmPayment: launchContract,
            contractCost: Web3.utils.fromWei(contract.cost.WISH, 'ether'),
            withoutCloser: true
        };
    };

    $scope.payContract = function() {
        var contract = $scope.contract;
        $rootScope.getCurrentUser().then(function(data) {
            if ($rootScope.currentUser.is_ghost) {
                $rootScope.commonOpenedPopup = 'ghost-user-alarm';
                return;
            }
            var openConditionsPopUp = function() {
                var originalCost = new BigNumber(contract.cost.WISH);
                var changedBalance = originalCost.minus(originalCost.times(contract.discount).div(100));
                if (new BigNumber($rootScope.currentUser.balance).minus(changedBalance) < 0) {
                    $rootScope.commonOpenedPopupParams = {
                        withoutCloser: true,
                        noBackgroundCloser: true
                    };
                    $rootScope.commonOpenedPopup = 'less-balance';
                    return;
                }
                $rootScope.commonOpenedPopupParams = {
                    contract: contract,
                    withoutCloser: true,
                    class: 'conditions',
                    newPopupContent: true,
                    actions: {
                        showPriceLaunchContract: showPriceLaunchContract
                    }
                };
                $rootScope.commonOpenedPopup = 'disclaimers/conditions';
            };

            var promoIsEntered = $scope.getDiscount();

            if (promoIsEntered) {
                promoIsEntered.then(openConditionsPopUp, openConditionsPopUp);
            } else {
                openConditionsPopUp();
            }
        }, function() {
        });
    };


    $scope.changePromoCode = function() {
        $scope.discountError = false;
        $scope.contract.discount = 0;
    };

    $scope.getDiscount = function() {
        if (!$scope.contract.promo) return;
        var originalCost = new BigNumber($scope.contract.cost.WISH);
        return contractService.getDiscount({
            contract_type: $scope.contract.contract_type,
            promo: $scope.contract.promo
        }).then(function(response) {
            $scope.contract.discount = response.data.discount;
            $rootScope.commonOpenedPopupParams = {
                withoutCloser: true,
                contract: $scope.contract
            };

            $rootScope.commonOpenedPopup = 'promo-code-activated';

        }, function(response) {
            $scope.contract.discount = 0;
            switch (response.status) {
                case 403:
                    $scope.discountError = response.data.detail;
                    break;
            }
        });
    };

}).controller('instructionsController', function($scope, web3Service) {

    var web3 = web3Service.web3();
    var contractDetails = $scope.ngPopUp.params.contract.contract_details, contract;

    var killInterfaceMethod = web3Service.getMethodInterface('kill', contractDetails.eth_contract.abi);
    $scope.killSignature = (new Web3()).eth.abi.encodeFunctionCall(killInterfaceMethod);

    var iAliveInterfaceMethod = web3Service.getMethodInterface('imAvailable', contractDetails.eth_contract.abi);
    $scope.iAliveSignature = (new Web3()).eth.abi.encodeFunctionCall(iAliveInterfaceMethod);




    web3Service.getAccounts().then(function(result) {
        $scope.currentWallet = result.filter(function(wallet) {
            return wallet.wallet.toLowerCase() === contractDetails.user_address.toLowerCase();
        })[0];
        if ($scope.currentWallet) {
            web3Service.setProvider($scope.currentWallet.type);
            contract = web3Service.createContractFromAbi(contractDetails.eth_contract.address, contractDetails.eth_contract.abi);
        }
    });

    $scope.sendDeposit = function() {
        web3.eth.sendTransaction({
            to: contractDetails.eth_contract.address,
            from: $scope.currentWallet.wallet
        }, console.log);
    };

    $scope.killContract = function() {
        contract.methods.kill().send({
            from: $scope.currentWallet.wallet
        }).then(console.log);
    };


    $scope.sendIAlive = function() {
        contract.methods.imAvailable().send({
            from: $scope.currentWallet.wallet
        }).then(console.log);
    };

});
