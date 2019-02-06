angular.module('app').controller('joinTronishAirdropController', function($scope, $timeout, EOSService, TronService,
                                                                          web3Service, AIRDROP_TRONISH_TOOL) {

    $scope.request = {};

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


    /** TRON account methods **/

    var tronAirdropContract = true;


    $scope.closeExtensionAlert = function() {
        $scope.extensionNotInstalled =
            $scope.extensionNotAuthorized =
                $scope.extensionOtherUser =
                    $scope.successTx =
                        $scope.extensionNotSelectedNetwork =
                            $scope.txServerError = false;
    };


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

        if ((tronAddressField && !tronAddressField.$valid) || (!$scope.request.tron_address)) {
            return;
        }
        $scope.attachedTRONAddress = true;

        tronAirdropContract.isRegistered(
            TronWeb.address.toHex($scope.request.tron_address)
        ).call().then(function(result) {
            $scope.attachedTRONAddress = result ? $scope.request.tron_address : false;
            $scope.$apply();
        }, console.log);
    };

    $scope.attachTronAddress = function() {

        if (!window.tronWeb) {
            $scope.TRONExtensionInfo.extensionNotInstalled = true;
            return;
        } else if (!window.tronWeb.defaultAddress) {
            $scope.TRONExtensionInfo.extensionNotAuthorized = true;
            return;
        } else if (
            (window.tronWeb.defaultAddress.hex !== $scope.request.tron_address) &&
            (window.tronWeb.defaultAddress.base58 !== $scope.request.tron_address)) {
            $scope.TRONExtensionInfo.extensionOtherUser = true;
            return;
        }

        TronService.connectToNetwork(TRONNetwork).then(function(trueConnection) {
            if (trueConnection.tronWeb !== window.tronWeb) {
                $scope.TRONExtensionInfo.extensionNotSelectedNetwork = true;
            } else {
                tronAirdropContract.put()
                    .send().then(function(result) {
                    $scope.TRONExtensionInfo.successTx = {
                        transaction_id: result
                    };
                    $scope.$apply();
                }, function(response) {
                    $scope.TRONExtensionInfo.txServerError = true;
                    $scope.$apply();
                });
            }
        });
    };


    $scope.closeExtensionAlert = function() {
        $scope.TRONExtensionInfo = {
            extensionNotInstalled: false,
            extensionNotAuthorized: false,
            extensionOtherUser: false,
            txServerError: false,
            successTx: false
        };
    };
    $scope.closeExtensionAlert();



    /** EOS account methods **/
    $scope.resetEOSField = function() {
        $scope.eosBalanceInProgress = false;
        $scope.checkedEOSISHBalance = false;
        $scope.currentEOSTRONAddress = false;
    };

    $scope.onSelectEOSAccount = function(ctrl, accountInfo) {
        $scope.eosBalanceInProgress = true;
        EOSService.getBalance('buildertoken', accountInfo.account_name, 'EOSISH', EOSNetwork).then(function(result) {
            $scope.checkedEOSISHBalance = result.length ? new BigNumber(result[0].split(' ')[0]).round().toString(10) : '0';
            $scope.eosBalanceInProgress = false;
            checkEosTronAddress();
        }, function() {
            $scope.eosBalanceInProgress = false;
        });
    };

    $scope.closeScatterAlert = function() {
        $scope.scatterNotInstalled = false;
        $scope.accountNotFinded = false;
        $scope.mintServerError = false;
    };

    $scope.attachEosTronAddress = function() {
        $scope.scatterNotInstalled = !EOSService.checkScatter();
        if ($scope.scatterNotInstalled) return;
        EOSService.sendTx({
            actions: [{
                account: eosContractAddress,
                name: 'put',
                data: {
                    'eos_account': $scope.request.eos_address,
                    'tron_address': TronWeb.address.toHex($scope.request.tron_address)
                }
            }],
            owner: $scope.request.eos_address
        }).then(function(result) {
            $scope.contract = {
                network: EOSNetwork
            };
            $scope.successTx = result.transaction_id;
        }, console.log)
    };

    var checkEosTronAddress = function() {
        EOSService.getTableRows(
            eosContractAddress,
            'mappings',
            eosContractAddress, EOSNetwork,
            $scope.request.eos_address
        ).then(function(response) {
            $scope.currentEOSTRONAddress = response.rows.filter(function(oneRow) {
                return oneRow.eos_account === $scope.request.eos_address;
            })[0];
            if ($scope.currentEOSTRONAddress) {
                $scope.currentEOSTRONAddress.tron_address =
                    TronWeb.address.fromHex($scope.currentEOSTRONAddress.tron_address);
            } else {
                $scope.currentEOSTRONAddress = null;
            }
        });
    };










    /** ETH account methods **/

    var checkAddressTimeout;


    var web3 = web3Service.web3();


    var getETHTRONAddress = function(enteredAddress, addressField) {
        var address = Web3.utils.toChecksumAddress(enteredAddress);
        var contract = web3Service.createContractFromAbi(contractAddress, AIRDROP_TRONISH_TOOL.ABI);
        contract.methods.get(address).call(function(error, response) {

            $scope.WISHBbalanceInProgress = false;

            if (/0x[0]{40}/.test(response)) {
                error = true;
                response = false;
            }
            if (error || (enteredAddress !== addressField.$viewValue)) {
                $scope.$apply();
                return;
            }
            $scope.checkedTRONAddress = TronWeb.address.fromHex(response.replace(/0x/, '41'));
            $scope.$apply();
        });
    };


    var checkBalanceTimer;
    $scope.checkETHAddress = function(addressField) {
        $scope.checkedWISHBalance = false;
        $scope.checkedTRONAddress = false;

        if (!addressField.$valid) return;
        $scope.WISHBbalanceInProgress = true;
        var address = Web3.utils.toChecksumAddress(addressField.$viewValue);
        var enteredAddress = addressField.$viewValue;
        checkBalanceTimer ? $timeout.cancel(checkBalanceTimer) : false;

        web3Service.setProviderByNumber(ETHNetwork);

        checkBalanceTimer = $timeout(function() {
            web3.eth.call({
                to: "0x1b22c32cd936cb97c28c5690a0695a82abf688e6",
                data: "0x70a08231000000000000000000000000" + address.split('x')[1]
            }, function(error, response) {
                if (error || (addressField.$viewValue !== enteredAddress)) {
                    $scope.WISHBbalanceInProgress = false;
                    $scope.$apply();
                    return
                }
                $scope.checkedWISHBalance = Web3.utils.fromWei(new BigNumber(Web3.utils.hexToNumberString(response)).toString(10), 'ether');
                getETHTRONAddress(enteredAddress, addressField);
            });
        }, 500);
    };

    $scope.checkAddress = function(addressField) {
        addressField.$setValidity('not-checked', true);
        if (!addressField.$valid) return;
        addressField.$setValidity('not-checked', false);
        if (!addressField.$viewValue) {
            return;
        }
        checkAddressTimeout ? $timeout.cancel(checkAddressTimeout) : false;
        var address = addressField.$viewValue;
        checkAddressTimeout = $timeout(function() {
            EOSService.checkAddress(addressField.$viewValue, 10).then(function(addressInfo) {
                if (address !== addressField.$viewValue) return;
                addressField.$setValidity('not-checked', true);
            });
        }, 200);
    };


}).controller('airdropTronishToolInstruction', function(AIRDROP_TRONISH_TOOL, web3Service, $scope) {


    var isProduction = web3Service.isProduction();

    var contractAddress = isProduction ?
        AIRDROP_TRONISH_TOOL.CONTRACT_ADDRESS_MAINNET :
        AIRDROP_TRONISH_TOOL.CONTRACT_ADDRESS;

    $scope.network = 1;
    web3Service.setProviderByNumber($scope.network);

    $scope.contractAddress = contractAddress;

    var interfaceMethod = web3Service.getMethodInterface('put', AIRDROP_TRONISH_TOOL.ABI);

    var tronAddress = TronWeb.address.toHex($scope.ngPopUp.params.tron_address).replace(/^41/, '0x');

    $scope.setAddressSignature = (new Web3()).eth.abi.encodeFunctionCall(
        interfaceMethod, [tronAddress]
    );

    web3Service.getAccounts($scope.network).then(function(result) {
        $scope.currentWallet = result.filter(function(wallet) {
            return wallet.wallet.toLowerCase() === $scope.ngPopUp.params.eth_address.toLowerCase();
        })[0];
    });

    $scope.sendTransaction = function() {
        web3Service.setProvider($scope.currentWallet.type, $scope.network);
        var contract = web3Service.createContractFromAbi(contractAddress, AIRDROP_TRONISH_TOOL.ABI);
        contract.methods.put(tronAddress).send({
            from: $scope.currentWallet.wallet
        }, function() {

        });
    };
});
