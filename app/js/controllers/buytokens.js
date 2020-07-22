angular.module('app').controller('buytokensController', function($scope, $timeout, $rootScope, $state, exRate,
                                                                 APP_CONSTANTS, $filter) {

    $scope.exRate = exRate.data;
    $scope.wallets = {metamask: [], parity: []};

    if (window['BRWidget']) {
        $timeout(function() {
            var widget = window['BRWidget'].init('bestrate-widget', 'mywish-widget');
            widget.send({
                tokenWithdrawalWallet: $rootScope.currentUser.internal_address,
                email: $filter('isEmail')($rootScope.currentUser.username) ? $rootScope.currentUser.username : undefined
            } , {}, {});
        });
    }

    $scope.copied = {};

    var resetForm = function() {
        $scope.formData = {};
        $scope.amountsValues = {};
    };

    resetForm();

    $scope.visibleForm = 'bnb-wish';

    $scope.$watch('visibleForm', function() {
        resetForm();
    });

    $scope.payDone = function() {
        $state.go($rootScope.currentUser.contracts ? 'main.contracts.list' : 'main.createcontract.types');
    };

    $scope.convertAmountTo = function(toField) {
        var rate = $scope.exRate[toField];
        var currencyValue = new BigNumber($scope.amountsValues.WISH || 0);
        $scope.amountsValues[toField]  = currencyValue.times(rate).round(2).toString(10);
        convertToUSDT();
    };

    $scope.convertAmountFrom = function(fromField) {
        var rate = $scope.exRate[fromField];
        var currencyValue = new BigNumber($scope.amountsValues[fromField] || 0);
        $scope.amountsValues.WISH  = currencyValue.div(rate).round(2).toString(10);
        convertToUSDT();
    };

    var convertToUSDT = function() {
        var rate = $scope.exRate['USDT'];
        var currencyValue = new BigNumber($scope.amountsValues.WISH || 0);
        $scope.amountsValues['USDT']  = currencyValue.times(rate).round(2).toString(10);
    };


    $scope.paymentSelect = {
        methods: [
            {
                'label': 'WISH Binance',
                'value': 'bnb-wish',
                'select-icon': '/static/images/blockchain/mwbnb2.svg'
            }/*, {
                'label': 'WISH Ethereum',
                'value': 'wish',
                'select-icon': '/static/images/blockchain/mweth2.svg'
            }*/, {
                'label': 'SWAP',
                'value': 'swap',
                'select-icon': '/static/images/logos/swap-logo.svg'
            }, {
                'label': 'BNB',
                'value': 'bnb',
                'select-icon': '/static/images/blockchain/binance-coin-logo.svg'
            }, {
                'label': 'OKB',
                'value': 'okb',
                'select-icon': '/static/images/blockchain/okb.svg'
            }, {
                'label': 'ETH',
                'value': 'eth',
                'select-icon': '/static/images/blockchain/ethereum.png'
            }, {
                'label': 'BTC',
                'value': 'btc',
                'select-icon': '/static/images/blockchain/bitcoin.svg'
            }, {
                'label': 'EOS',
                'value': 'eos',
                'select-icon': '/static/images/blockchain/eos.svg'
            }, {
                'label': 'TRON',
                'value': 'tron',
                'select-icon': '/static/images/blockchain/tron.svg'
            }, {
                'label': 'TRONISH',
                'value': 'tronish',
                'select-icon': '/static/images/logos/tronish-logo.svg'
            }, {
                'label': 'EOSISH',
                'value': 'eosish',
                'select-icon': '/static/images/blockchain/eosish-logo.svg'
            }
        ]
    };

    $scope.changeToken = function() {

    };

}).controller('buyWishByEthController', function($scope, web3Service) {


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
            value: new BigNumber($scope.amountsValues['ETH']).times(new BigNumber(10).toPower(18)).toString(10),
            from: $scope.formData.address,
            to: $scope.currentUser.internal_address
        }, function() {
            console.log(arguments);
        });
    };


}).controller('buyWishByBnbController', function($scope, web3Service) {


}).controller('buyWishByWishController', function($scope, $state, $rootScope, APP_CONSTANTS, web3Service) {

    $scope.wishAddress = APP_CONSTANTS.WISH.ADDRESS;

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

    $scope.$watch('amountsValues.WISH', function() {
        if (!$scope.amountsValues.WISH) return;

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
        }, [
            $scope.currentUser.internal_address,
            new BigNumber($scope.amountsValues.WISH).times(Math.pow(10, 18)).toString(10)
        ]);
    });

    $scope.sendTransaction = function() {
        $scope.getProvider($scope.formData.activeService).eth.sendTransaction({
            from: $scope.formData.address,
            to: APP_CONSTANTS.WISH.ADDRESS,
            data: $scope.checkedTransferData
        }).then(console.log);
    };

}).controller('buyWishBySwapController', function($scope, $state, $rootScope, APP_CONSTANTS, web3Service) {

    $scope.swapAddress = APP_CONSTANTS.SWAP.ADDRESS;
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

    $scope.$watch('amountsValues.SWAP', function() {
        if (!$scope.amountsValues.SWAP) return;

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
        }, [
            $scope.currentUser.internal_address,
            new BigNumber($scope.amountsValues.SWAP).times(Math.pow(10, 18)).toString(10)
        ]);
    });

    $scope.sendTransaction = function() {
        $scope.getProvider($scope.formData.activeService).eth.sendTransaction({
            from: $scope.formData.address,
            to: APP_CONSTANTS.SWAP.ADDRESS,
            data: $scope.checkedTransferData
        }).then(console.log);
    };

}).controller('buyWishByOkbController', function($scope, $state, $rootScope, APP_CONSTANTS, web3Service) {

    $scope.swapAddress = APP_CONSTANTS.OKB.ADDRESS;
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

    $scope.$watch('amountsValues.OKB', function() {
        if (!$scope.amountsValues.OKB) return;

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
        }, [
            $scope.currentUser.internal_address,
            new BigNumber($scope.amountsValues.OKB).times(Math.pow(10, 18)).toString(10)
        ]);
    });

    $scope.sendTransaction = function() {
        $scope.getProvider($scope.formData.activeService).eth.sendTransaction({
            from: $scope.formData.address,
            to: APP_CONSTANTS.OKB.ADDRESS,
            data: $scope.checkedTransferData
        }).then(console.log);
    };

});



