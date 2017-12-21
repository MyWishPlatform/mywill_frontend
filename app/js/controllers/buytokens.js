angular.module('app').controller('buytokensController', function($scope, $timeout) {

    $scope.formData = {
        gaslimit: 30000,
        toAddress: '0xce85a63f5093b28f15aa7c2c1f1b4b0037011cbe'
    };

    var metamask, parity;
    $scope.wallets = {metamask: [], parity: []};

    metamask = new Web3(Web3.givenProvider || new Web3.providers.WebsocketProvider("ws://localhost:8546"));

    parity = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));

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


}).controller('buytokensEthController', function($scope) {




    $scope.checkWishesAmount = function() {

    };

    $scope.checkEthAmount = function() {

    };
}).controller('buytokensWishController', function($scope) {
    $scope.payDone = function() {
        console.log(123);
    }
});