angular.module('app').controller('tronishCalculatorController', function($scope, EOSService, web3Service, TronService,
                                                                         AIRDROP_TRONISH_TOOL) {


    $scope.request = {};
    $scope.tronishBalances = {};


    var EOSNetwork = 10;
    var ETHNetwork = 1;
    var TRONNetwork = 14;

    var isProduction = web3Service.isProduction();

    var contractAddress = isProduction ?
        AIRDROP_TRONISH_TOOL.CONTRACT_ADDRESS_MAINNET :
        AIRDROP_TRONISH_TOOL.CONTRACT_ADDRESS;


    var eosContractAddress = isProduction ?
        AIRDROP_TRONISH_TOOL.EOS_CONTRACT_ADDRESS_MAINNET :
        AIRDROP_TRONISH_TOOL.EOS_CONTRACT_ADDRESS;

    var tronContractAddress = isProduction ?
        AIRDROP_TRONISH_TOOL.TRON_CONTRACT_ADDRESS_MAINNET :
        AIRDROP_TRONISH_TOOL.TRON_CONTRACT_ADDRESS;

    $scope.checkedEthAddress = false;
    $scope.checkedEosAddress = false;

    web3Service.setProviderByNumber(ETHNetwork);

    var getETHTRONAddress = function() {
        var address = Web3.utils.toChecksumAddress($scope.request.eth_address);
        var enteredAddress = $scope.request.eth_address;
        var contract = web3Service.createContractFromAbi(contractAddress, AIRDROP_TRONISH_TOOL.ABI);
        contract.methods.get(address).call(function(error, response) {
            if (error || (enteredAddress !== $scope.request.eth_address)) {
                $scope.ethBalanceInProgress = false;
                // $scope.$apply();
                return;
            }
            $scope.checkedEthAddress = true;
            if (!/^0x[0]{40}$/.test(response)) {
                $scope.checkedETHTRONAccount = TronWeb.address.fromHex(response.replace(/^0x/, '41'));
            }
            $scope.$apply();
        });
    };

    $scope.checkEthAddress = function(ethForm) {
        $scope.tronishBalances.eth = false;
        $scope.checkedEthAddress = false;
        $scope.checkedETHTRONAccount = false;

        var addressField = ethForm.eth_address;
        var enteredAddress = addressField.$viewValue;

        if (!ethForm.$valid) return;
        getETHTRONAddress($scope.request.eth_address);
        web3.eth.call({
            to: "0x1b22c32cd936cb97c28c5690a0695a82abf688e6",
            data: "0x70a08231000000000000000000000000" + enteredAddress.split('x')[1]
        }, function(error, response) {
            if (error || (addressField.$viewValue !== enteredAddress)) {
                $scope.ethBalanceInProgress = false;
                $scope.$apply();
                return
            }
            $scope.tronishBalances.eth = Web3.utils.fromWei(
                new BigNumber(Web3.utils.hexToNumberString(response)).toString(10), 'ether'
            );
            $scope.$apply();
        });
    };


    var getEOSTRONAddress = function() {
        EOSService.getTableRows(
            eosContractAddress,
            'mappings',
            eosContractAddress, EOSNetwork,
            $scope.request.eos_address
        ).then(function(response) {
            var checkedEOSTRONAccount = response.rows.filter(function(oneRow) {
                return oneRow.eos_account === $scope.request.eos_address;
            })[0];
            if (checkedEOSTRONAccount) {
                $scope.checkedEOSTRONAccount =
                    TronWeb.address.fromHex(checkedEOSTRONAccount.tron_address);
            } else {
                $scope.checkedEOSTRONAccount = null;
            }
        });
    };

    $scope.checkEosAddress = function(ctrl, accountInfo) {
        EOSService.getBalance('buildertoken', accountInfo.account_name, 'EOSISH', EOSNetwork).then(function(result) {
            $scope.tronishBalances.eos = result.length ? new BigNumber(result[0].split(' ')[0]).div(20).round().toString(10) : '0';
            getEOSTRONAddress();
        }, function() {

        });
    };

    $scope.resetEosBalance = function() {
        $scope.tronishBalances.eos = false;
    };


    var tronAirdropContract;
    TronService.createContract(
        AIRDROP_TRONISH_TOOL.TRON_ABI,
        tronContractAddress,
        TRONNetwork
    ).then(function(result) {
        tronAirdropContract = result;

        if (window.tronWeb && window.tronWeb.defaultAddress) {
            $scope.request.tron_address = window.tronWeb.defaultAddress.base58 || '';
            $scope.checkTronAddress();
        }

    });

    $scope.checkTronAddress = function(tronAddressField) {
        $scope.attachedTRONAddress = false;
        $scope.tronishBalances.tron = false;
        if ((tronAddressField && !tronAddressField.$valid) || (!$scope.request.tron_address)) {
            return;
        }
        $scope.attachedTRONAddress = true;

        tronAirdropContract.isRegistered(
            TronWeb.address.toHex($scope.request.tron_address)
        ).call().then(function(result) {
            console.log(result);
            $scope.attachedTRONAddress = result ? $scope.request.tron_address : false;
            $scope.$apply();
        }, console.log);

        TronService.getAccount($scope.request.tron_address, TRONNetwork).then(function(response) {
            if (!response.error) {
                var TRXBalance = new BigNumber(response.result.balance).plus(response.result.account_resource.frozen_balance_for_energy.frozen_balance).div(Math.pow(10, 6));
                if (TRXBalance.minus(1000) > 0) {
                    $scope.tronishBalances.tron = TRXBalance.div(10000).round(4).toString(10);
                } else {
                    $scope.tronishBalances.tron = '0';
                }
            }
        });
    };


});
