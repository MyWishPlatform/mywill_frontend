angular.module('app').controller('buytokensController', function($scope, $timeout, $rootScope, $state, exRate) {

    $scope.exRate = exRate.data;

    var metamask, parity;
    $scope.wallets = {metamask: [], parity: []};

    try {
        metamask = new Web3(Web3.givenProvider || new Web3.providers.WebsocketProvider("ws://localhost:8546"));
    } catch(err) {
        console.log(err);
    }

    try {
        parity = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
    } catch(err) {
        console.log(err);
    }

    metamask.eth.getAccounts(function(err, addresses) {
        $scope.wallets.metamask = addresses;
    });

    parity.eth.getAccounts(function(err, addresses) {
        $scope.wallets.parity = addresses;
    });


    $scope.sendTransaction = function() {
        var web3;
        switch ($scope.formData.activeService) {
            case 'metamask':
                web3 = metamask;
                break;
            case 'parity':
                web3 = parity;
                break;
        }

        web3.eth.sendTransaction({
            value: new BigNumber($scope.formData.amount).times(new BigNumber(10).toPower(18)).toString(16),
            from: $scope.formData.address,
            to: $scope.formData.toAddress,
            gas: $scope.formData.gaslimit,
            gasPrice: 25 * Math.pow(10, 9)
            // data: '603d80600c6000396000f3007c01000000000000000000000000000000000000000000000000000000006000350463c6888fa18114602d57005b6007600435028060005260206000f3'
            // nonce: ''
        }, function() {
            console.log(arguments);
        });
    };

    $scope.checkWishAddress = function() {
        $scope.formData.addressChecked = true;
    };


    $scope.copied = {};
    var copiedTimeouts = {};

    $scope.successCodeCopy = function(obj, copiedField) {
        obj = obj || $scope;
        obj['copied'] = obj['copied'] || {};
        copiedTimeouts[copiedField] ? $timeout.cancel(copiedTimeouts[copiedField]) : false;
        obj['copied'][copiedField] = true;
        copiedTimeouts[copiedField] = $timeout(function() {
            obj['copied'][copiedField] = false;
        }, 3000);
    };
    $scope.failCodeCopy = function() {
        console.log(arguments);
    };

    var resetForm = function() {
        $scope.formData = {
            gaslimit: 30000,
            toAddress: '0xce85a63f5093b28f15aa7c2c1f1b4b0037011cbe'
        };
    };
    resetForm();
    $scope.$watch('visibleForm', function() {
        resetForm();
    });



}).controller('buytokensEthController', function($scope) {
    var rate = $scope.exRate.ETH;
    $scope.checkWishesAmount = function() {
        var wishesAmount = new BigNumber($scope.formData.ethAmount || 0);
        $scope.formData.wishesAmount  = wishesAmount.div(rate).round(18).toString(10);
        $scope.formData.amount = $scope.formData.ethAmount;
    };
    $scope.checkEthAmount = function() {
        if (!$scope.formData.wishesAmount) return;
        var ethAmount = new BigNumber($scope.formData.wishesAmount);
        $scope.formData.ethAmount = ethAmount.times(rate).round(18).toString(10);
        $scope.formData.amount = $scope.formData.ethAmount;
    };
    $scope.payDone = function() {
        $state.go($rootScope.currentUser.contracts ? 'main.contracts.list' : 'main.createcontract.form');
    }
}).controller('buytokensBtcController', function($scope) {
    var rate = $scope.exRate.BTC;
    $scope.checkWishesAmount = function() {
        if (!$scope.formData.btcAmount) return;
        var wishesAmount = new BigNumber($scope.formData.btcAmount);
        $scope.formData.wishesAmount  = wishesAmount.div(rate).round(18).toString(10);
    };
    $scope.checkBtcAmount = function() {
        if (!$scope.formData.wishesAmount) return;
        var btcAmount = new BigNumber($scope.formData.wishesAmount);
        $scope.formData.btcAmount = btcAmount.times(rate).round(18).toString(10);
    };
}).controller('buytokensWishController', function($scope, $state, $rootScope) {
    $scope.payDone = function() {
        $state.go($rootScope.currentUser.contracts ? 'main.contracts.list' : 'main.createcontract.form');
    }
});