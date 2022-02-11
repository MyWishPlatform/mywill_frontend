angular.module('app').controller('bnbCrowdSalePreviewController', function($timeout, $rootScope, contractService, web3Service,
                                                                        openedContract, $scope, $filter) {
    // console.log('bnbCrowdSalePreviewController',$scope,$rootScope);
    $scope.contract = openedContract.data;

    var tokenTypes = {
        ERC20: 'BEP20',
        ERC223: 'ERC223',

    };
    $scope.contract.contract_details.token_type = tokenTypes[$scope.contract.contract_details.token_type];

    $scope.iniContract($scope.contract);

    var contractDetails = $scope.contract.contract_details;


    var getVerificationStatus = function () {
        contractService.getContract($scope.contract.id).then(function(response) {
            console.log('bnbCrowdSalePreviewController getVerificationStatus',response);
            $scope.contract.verification_status = response.data.contract_details.verification_status;
        });
    }
    getVerificationStatus();

    var getVerificationCost = function () {
        contractService.getVerificationCost().then(function(response) {
            console.log('bnbCrowdSalePreviewController getVerificationCost',response);
            $scope.contract.verificationCost = {
                USDT: new BigNumber(response.data.USDT).div(10e5).toFixed(3).toString(10),
                WISH: new BigNumber(response.data.WISH).div(10e17).toFixed(3).toString(10),
                ETH: new BigNumber(response.data.ETH).div(10e17).toFixed(3).toString(10),
                BTC: new BigNumber(response.data.BTC).div(10e7).toFixed(6).toString(10),
            };
        });
    }
    getVerificationCost();

    $scope.blockchain = 'BNB';
    $scope.contractCrowdsaleInfo = 'eth_contract_crowdsale';
    $scope.contractTokenInfo = 'eth_contract_token';

    if (contractDetails.eth_contract_token && contractDetails.eth_contract_token.address) {
        web3Service.setProviderByNumber($scope.contract.network);
        var contractWeb3 = web3Service.createContractFromAbi(
            contractDetails.eth_contract_token.address,
            contractDetails.eth_contract_token.abi
        );

        contractWeb3.methods.freezingBalanceOf(contractDetails.admin_address.toLowerCase()).call(function(error, result) {
            if (error) return;
            if (result * 1) {
                $scope.tokensFreezed = true;
            }
            $scope.$apply();
        });
    }

    $scope.currencyPow = 18;

    if (contractDetails.eth_contract_crowdsale && contractDetails.eth_contract_crowdsale.address) {
        web3Service.setProvider('infura', $scope.contract.network);
        var contract = web3Service.createContractFromAbi(contractDetails.eth_contract_crowdsale.address, contractDetails.eth_contract_crowdsale.abi);
        if (typeof contract.methods.vault === 'function') {
            contract.methods.vault().call(function(error, result) {
                if (error) return;
                contractDetails.eth_contract_crowdsale.vault = result;
                $scope.$apply();
            });
        }
        if (contractDetails.whitelist) {
            contractService.getWhiteList($scope.contract.id, {limit: 1}).then(function(response) {
                $scope.whiteListedAddresses = response.data;
            });
        }
    }

    contractDetails.time_bonuses = contractDetails.time_bonuses || [];
    contractDetails.time_bonuses.map(function(bonus) {
        bonus.min_amount = bonus.min_amount ? new BigNumber(bonus.min_amount).times(contractDetails.rate).div(Math.pow(10,$scope.currencyPow)).toFixed().toString(10) : undefined;
        bonus.max_amount = bonus.max_amount ? new BigNumber(bonus.max_amount).times(contractDetails.rate).div(Math.pow(10,$scope.currencyPow)).toFixed().toString(10) : undefined;
        bonus.min_time = bonus.min_time ? bonus.min_time * 1000 : undefined;
        bonus.max_time = bonus.max_time ? bonus.max_time * 1000 : undefined;
    });

    var bonuses = angular.copy(contractDetails.time_bonuses || []);
    $scope.timeBonusChartData = [];

    bonuses.map(function(currBonus, index) {
        currBonus.isTimesAmount = currBonus.min_time && currBonus.min_time;
        currBonus.isTokensAmount = currBonus.min_amount && currBonus.max_amount;
        var bonus = {
            bonus: currBonus.bonus,
            min_amount: currBonus.min_amount,
            max_amount: currBonus.max_amount,
            min_time: currBonus.min_time,
            max_time: currBonus.max_time
        };
        var indexOfTimeBonus = bonuses.indexOf(currBonus);
        var prevTimeBonuses = bonuses.filter(function(bon, index) {
            return (index < indexOfTimeBonus) && bon.isTimesAmount;
        });
        var prevTimeBonus = prevTimeBonuses[prevTimeBonuses.length - 1];
        var prevTokenBonuses = bonuses.filter(function(bon, index) {
            return (index < indexOfTimeBonus) && bon.isTokensAmount;
        });
        var prevTokenBonus = prevTokenBonuses[prevTokenBonuses.length - 1];
        var prevOnlyTimeBonuses = bonuses.filter(function(bon, index) {
            return (index < indexOfTimeBonus) && bon.isTimesAmount && !bon.isTokensAmount;
        });
        var prevOnlyTimeBonus = prevOnlyTimeBonuses[prevOnlyTimeBonuses.length - 1];

        var prevOnlyTokenBonuses = bonuses.filter(function(bon, index) {
            return (index < indexOfTimeBonus) && bon.isTokensAmount && !bon.isTimesAmount;
        });
        var prevOnlyTokenBonus = prevOnlyTokenBonuses[prevOnlyTokenBonuses.length - 1];
        if (!currBonus.isTimesAmount) {
            // bonus.min_time = prevTimeBonus ? prevTimeBonus.max_time : false;
            // bonus.max_time = false;
        }
        if (prevOnlyTimeBonus !== prevTimeBonus) {
            bonus.prev_min_time = prevOnlyTimeBonus ? prevOnlyTimeBonus.max_time : false;
        } else {
            bonus.prev_min_time = bonus.min_time;
        }
        if (!currBonus.isTokensAmount) {
            // bonus.min_amount = prevTokenBonus ? prevTokenBonus.max_amount : false;
            // bonus.max_amount = false;
        }
        if (prevOnlyTokenBonus !== prevTokenBonus) {
            bonus.prev_min_amount = prevOnlyTokenBonus ? prevOnlyTokenBonus.max_amount : false;
        } else {
            bonus.prev_min_amount = bonus.min_amount;
        }
        $scope.timeBonusChartData.push(bonus);
    });

    var amountBonuses = angular.copy(contractDetails.amount_bonuses || []);
    $scope.amountBonusChartData = [];
    amountBonuses.map(function(item) {
        var chartItem = {
            valueY: item.bonus,
            maxValueX: item.max_amount,
            minValueX: item.min_amount
        };
        $scope.amountBonusChartData.push(chartItem);
    });

    contractDetails.hard_cap_eth = new BigNumber(contractDetails.hard_cap).div(Math.pow(10,$scope.currencyPow)).toFixed(Math.min(2, contractDetails.decimals)).toString(10);
    contractDetails.soft_cap_eth = new BigNumber(contractDetails.soft_cap).div(Math.pow(10,$scope.currencyPow)).toFixed(Math.min(2, contractDetails.decimals)).toString(10);

    contractDetails.hard_cap = new BigNumber(contractDetails.hard_cap).times(contractDetails.rate).div(Math.pow(10,$scope.currencyPow)).toFixed().toString(10);
    contractDetails.soft_cap = new BigNumber(contractDetails.soft_cap).times(contractDetails.rate).div(Math.pow(10,$scope.currencyPow)).toFixed().toString(10);

    contractDetails.min_wei = contractDetails.min_wei !== null ? contractDetails.min_wei : undefined;
    contractDetails.max_wei = contractDetails.max_wei !== null ? contractDetails.max_wei : undefined;

    $scope.timeBonusChartParams = {
        max_time: contractDetails.stop_date,
        min_time: contractDetails.start_date,
        max_amount: contractDetails.hard_cap,
        min_amount: 0
    };

    contractDetails.amount_bonuses = contractDetails.amount_bonuses || [];
    contractDetails.amount_bonuses.map(function(bonus) {
        bonus.min_amount = new BigNumber(bonus.min_amount).div(Math.pow(10,$scope.currencyPow)).toFixed().toString(10);
        bonus.max_amount = new BigNumber(bonus.max_amount).div(Math.pow(10,$scope.currencyPow)).toFixed().toString(10);
    });

    if (contractDetails.eth_contract_crowdsale) {
        contractDetails.sources = {
            crowdsale: contractDetails.eth_contract_crowdsale.source_code || false,
            token: contractDetails.eth_contract_token.source_code || false
        };
    }

    var powerNumber = new BigNumber('10').exponentiatedBy(contractDetails.decimals || 0);
    contractDetails.token_holders.map(function(holder) {
        holder.amount = new BigNumber(holder.amount).div(powerNumber).toString(10);
    });

    var holdersSum = contractDetails.token_holders.reduce(function (val, item) {
        var value = new BigNumber(item.amount || 0);
        return value.plus(val);
    }, new BigNumber(0));

    var ethSum = holdersSum.plus(contractDetails.hard_cap);
    $scope.totalSupply = {
        eth: ethSum.div(contractDetails.rate).toFixed(2).toString(10),
        tokens: ethSum.toFixed(2).toString(10)
    };


    $scope.chartOptions = {
        itemValue: 'amount',
        itemLabel: 'address'
    };
    $scope.chartData = angular.copy(contractDetails.token_holders);
    $scope.chartData.unshift({
        amount: contractDetails.hard_cap,
        address: $filter('translate')('CONTRACTS.FOR_SALE')
    });


    $scope.verificationBuyRequest = false;
    var verificationBuy = function() {
        $scope.verificationBuyRequest = true;
        const params = {contract_id: $scope.contract.id}
        contractService.buyVerification(params).then(function(response) {
            console.log('buyVerification',response.data)
            $scope.verificationBuyRequest = false;
            window.location.reload();
            // contractService.getContract($scope.contract.id).then(function(response) {
            //     var newContractDetails = response.data.contract_details;
            // })
        }, function(err) {
            switch (err.status) {
                case 400:
                    switch(err.data.result) {
                        case 3:
                        case "3":
                            $rootScope.commonOpenedPopupParams = {
                                newPopupContent: true
                            };
                            $rootScope.commonOpenedPopup = 'errors/authio-less-balance';
                            break;
                    }
                    break;
            }
            $scope.verificationBuyRequest = false;
        });
    };
    $rootScope.contract = $scope.contract
    $rootScope.confirmVerificationPayment = verificationBuy
});






