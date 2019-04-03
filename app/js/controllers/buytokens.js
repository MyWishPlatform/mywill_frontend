angular.module('app').controller('buytokensController', function($scope, $timeout, $rootScope, $state, exRate,
                                                                 APP_CONSTANTS, web3Service, $filter, ENV_VARS) {

    $scope.exRate = exRate.data;
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

    if (window['BRWidget']) {
        $timeout(function() {
            var widget = window['BRWidget'].init('bestrate-widget', 'mywish-widget');
            widget.send({
                tokenWithdrawalWallet: $rootScope.currentUser.internal_address,
                email: $filter('isEmail')($rootScope.currentUser.username) ? $rootScope.currentUser.username : undefined
            } , {}, {});
        });
    }

    $scope.checkWishAddress = function() {
        $scope.formData.addressChecked = true;
    };

    $scope.copied = {};

    var resetForm = function() {
        $scope.formData = {
            toAddress: $rootScope.currentUser.internal_address,
            toBtcAddress: $rootScope.currentUser.internal_btc_address,
            wishAddress: APP_CONSTANTS.WISH.ADDRESS
        };
    };

    resetForm();

    $scope.$watch('visibleForm', function() {
        resetForm();
    });

    $scope.payDone = function() {
        $state.go($rootScope.currentUser.contracts ? 'main.contracts.list' : 'main.createcontract.types');
    };
}).controller('buytokensEthController', function($scope) {
    var rate = $scope.exRate.ETH;
    $scope.checkWishesAmount = function() {
        var wishesAmount = new BigNumber($scope.formData.ethAmount || 0);
        $scope.formData.wishesAmount  = wishesAmount.div(rate).round(2).toString(10);
        $scope.formData.amount = $scope.formData.ethAmount;
    };
    $scope.checkEthAmount = function() {
        if (!$scope.formData.wishesAmount) return;
        var ethAmount = new BigNumber($scope.formData.wishesAmount);
        $scope.formData.ethAmount = ethAmount.times(rate).round(2).toString(10);
        $scope.formData.amount = $scope.formData.ethAmount;
    };
}).controller('buytokensBnbController', function($scope) {
    var rate = $scope.exRate.BNB;
    $scope.checkWishesAmount = function() {
        var wishesAmount = new BigNumber($scope.formData.bnbAmount || 0);
        $scope.formData.wishesAmount  = wishesAmount.div(rate).round(2).toString(10);
        $scope.formData.amount = $scope.formData.bnbAmount;
    };
    $scope.checkBnbAmount = function() {
        if (!$scope.formData.wishesAmount) return;
        var ethAmount = new BigNumber($scope.formData.wishesAmount);
        $scope.formData.bnbAmount = ethAmount.times(rate).round(2).toString(10);
        $scope.formData.amount = $scope.formData.bnbAmount;
    };


    $scope.$watch('formData.amount', function() {
        if (!$scope.formData.amount) return;

        $scope.checkedTransferData = (new Web3).eth.abi.encodeFunctionCall({
            name: 'transfer',
            type: 'function',
            inputs: [{
                type: 'address',
                name: 'to'
            }, {
                type: 'uint256',
                name: 'value'
            }]
        }, [$scope.formData.toAddress, new BigNumber($scope.formData.amount).times(Math.pow(10, 18)).toString(10)]);
    });

    $scope.bnbAddress = '0xB8c77482e45F1F44dE1745F52C74426C631bDD52';

    $scope.sendTransaction = function() {
        $scope.getProvider($scope.formData.activeService).eth.sendTransaction({
            from: $scope.formData.address,
            data: $scope.checkedTransferData,
            to: $scope.bnbAddress
        }).then(console.log);
    };


}).controller('buytokensBtcController', function($scope) {
    var rate = $scope.exRate.BTC;
    $scope.checkWishesAmount = function() {
        if (!$scope.formData.btcAmount) return;
        var wishesAmount = new BigNumber($scope.formData.btcAmount);
        $scope.formData.wishesAmount  = wishesAmount.div(rate).round(2).toString(10);
    };
    $scope.checkBtcAmount = function() {
        if (!$scope.formData.wishesAmount) return;
        var btcAmount = new BigNumber($scope.formData.wishesAmount);
        $scope.formData.btcAmount = btcAmount.times(rate).round(2).toString(10);
    };

}).controller('buytokensWishController', function($scope, $state, $rootScope) {
    $scope.$watch('formData.amount', function() {
        if (!$scope.formData.amount) return;

        $scope.checkedTransferData = (new Web3).eth.abi.encodeFunctionCall({
            name: 'transfer',
            type: 'function',
            inputs: [{
                type: 'address',
                name: 'to'
            }, {
                type: 'uint256',
                name: 'value'
            }]
        }, [$scope.formData.toAddress, new BigNumber($scope.formData.amount).times(Math.pow(10, 18)).toString(10)]);
    });

    $scope.sendTransaction = function() {
        $scope.getProvider($scope.formData.activeService).eth.sendTransaction({
            from: $scope.formData.address,
            to: $scope.formData.wishAddress,
            data: $scope.checkedTransferData
        }).then(console.log);
    };

}).controller('buytokensTronController', function($scope) {
    var rate = $scope.exRate.TRX;
    $scope.checkWishesAmount = function() {
        var wishesAmount = new BigNumber($scope.formData.tronAmount || 0);
        $scope.formData.wishesAmount  = wishesAmount.div(rate).round(2).toString(10);
        $scope.formData.amount = $scope.formData.tronAmount;
    };
    $scope.checkTronAmount = function() {
        if (!$scope.formData.wishesAmount) return;
        var tronAmount = new BigNumber($scope.formData.wishesAmount);
        $scope.formData.tronAmount = tronAmount.times(rate).round(2).toString(10);
        $scope.formData.amount = $scope.formData.tronAmount;
    };
}).controller('buytokensEosController', function($scope) {
    var rate = $scope.exRate.EOS;
    $scope.checkWishesAmount = function() {
        var wishesAmount = new BigNumber($scope.formData.eosAmount || 0);
        $scope.formData.wishesAmount  = wishesAmount.div(rate).round(2).toString(10);
        $scope.formData.amount = $scope.formData.eosAmount;
    };
    $scope.checkEosAmount = function() {
        if (!$scope.formData.wishesAmount) return;
        var eosAmount = new BigNumber($scope.formData.wishesAmount);
        $scope.formData.eosAmount = eosAmount.times(rate).round(2).toString(10);
        $scope.formData.amount = $scope.formData.eosAmount;
    };
});