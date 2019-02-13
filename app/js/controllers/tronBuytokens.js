angular.module('app').controller('tronBuytokensController', function($scope, $timeout, $rootScope, $filter, $state,
                                                                    exRate, APP_CONSTANTS, web3Service) {

    $scope.exRate = exRate.data;
    $scope.payDone = function() {
        $state.go($rootScope.currentUser.contracts ? 'main.contracts.list' : 'main.createcontract.types');
    };

    $scope.tronAccountAddress = $rootScope.currentUser.tron_address;


    if (window['BRWidget'] && !$rootScope.eoslynx) {
        $timeout(function() {
            var widget = window['BRWidget'].init('bestrate-widget', '8ce55c6765e822cec89307052be65c50');
            widget.send({
                tokenWithdrawalWallet: $scope.eosAccountAddress,
                email: $filter('isEmail')($rootScope.currentUser.username) ? $rootScope.currentUser.username : undefined
            } , {}, {
                description: $rootScope.currentUser.memo
            });
        });
    }

    var resetForm = function() {
        $scope.formData = {
            toAddress: $rootScope.currentUser.internal_address,
            toBtcAddress: $rootScope.currentUser.internal_btc_address,
            wishAddress: APP_CONSTANTS.WISH.ADDRESS
        };
    };

    resetForm();

    $scope.visibleForm = false;

    $scope.$watch('visibleForm', function() {
        resetForm();
    });

    $scope.wallets = {metamask: [], parity: []};

    $scope.getProvider = function(name) {
        web3Service.setProvider(name, 1);
        return web3Service.web3();
    };

    web3Service.setProvider(name, 1);
    web3Service.getAccounts(1).then(function(response) {
        response.map(function(wallet) {
            $scope.wallets[wallet.type].push(wallet.wallet);
        });
    });

    $scope.sendTransaction = function() {
        $scope.getProvider($scope.formData.activeService).eth.sendTransaction({
            value: new BigNumber($scope.formData.amount).times(new BigNumber(10).toPower(18)).toString(10),
            from: $scope.formData.address,
            to: $scope.formData.toAddress
        }, function() {
            console.log(arguments);
        });
    };


}).controller('tronBuytokensTronController', function($scope, $rootScope) {

    var rate = $scope.exRate.TRON || 0.2;

    $scope.checkTronishAmount = function() {
        var tronishAmount = new BigNumber($scope.formData.tronAmount || 0);
        $scope.formData.tronishAmount  = tronishAmount.div(rate).round(2).toString(10);
        // $scope.formData.amount = $scope.formData.tronAmount;
    };

}).controller('tronBuytokensTronishController', function($scope, $rootScope) {
    $scope.formData = {};
}).controller('tronBuytokensEthController', function($scope) {
    var rate = $scope.exRate.ETH || 0.5;
    $scope.checkWishesAmount = function() {
        var wishesAmount = new BigNumber($scope.formData.ethAmount || 0);
        $scope.formData.tronishAmount  = wishesAmount.div(rate).round(2).toString(10);
        $scope.formData.amount = $scope.formData.ethAmount;
    };
    $scope.checkEthAmount = function() {
        if (!$scope.formData.tronishAmount) return;
        var ethAmount = new BigNumber($scope.formData.tronishAmount);
        $scope.formData.ethAmount = ethAmount.times(rate).round(2).toString(10);
        $scope.formData.amount = $scope.formData.ethAmount;
    };
}).controller('tronBuytokensBtcController', function($scope) {
    var rate = $scope.exRate.BTC || 1000;
    $scope.checkTronishAmount = function() {
        if (!$scope.formData.btcAmount) return;
        var tronishAmount = new BigNumber($scope.formData.btcAmount);
        $scope.formData.tronishAmount = tronishAmount.div(rate).round(2).toString(10);
    };
    $scope.checkBtcAmount = function() {
        if (!$scope.formData.tronishAmount) return;
        var btcAmount = new BigNumber($scope.formData.tronishAmount);
        $scope.formData.btcAmount = btcAmount.times(rate).round(2).toString(10);
    };

});




