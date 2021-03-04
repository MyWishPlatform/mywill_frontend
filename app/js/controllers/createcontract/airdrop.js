angular.module('app').controller('airdropCreateController', function($scope, contractService, $timeout, $state, $rootScope,
                                                                      CONTRACT_TYPES_CONSTANTS, openedContract, $stateParams, web3Service) {
    console.log('airdropCreateController', $scope)

    var contract = openedContract && openedContract.data ? openedContract.data : {
        name:  'MyAirdrop' + ($rootScope.currentUser.contracts + 1),
        contract_type: CONTRACT_TYPES_CONSTANTS.AIRDROP,
        network: $stateParams.network,
        contract_details: {}
    };
    $scope.network = contract.network;
    $scope.editContractMode = !!contract.id;
    var resetForm = function() {
        $scope.request = angular.copy(contract);
        console.log('resetForm',$scope.request,contract);
    };
    $scope.resetForms = resetForm;
    $scope.contractInProgress = false;
    var storage = window.localStorage || {};

    $scope.createContract = function() {
        var isWaitingOfLogin = $scope.checkUserIsGhost();
        if (!isWaitingOfLogin) {
            delete storage.draftContract;
            createContract();
            return;
        }
        storage.draftContract = JSON.stringify($scope.request);
        isWaitingOfLogin.then(function() {
            checkDraftContract(true)
        });
        return true;
    };
    var createContract = function() {
        if ($scope.contractInProgress) return;
        var contractDetails = angular.copy($scope.request);
        contractDetails.decimals = contractDetails.decimals * 1;
        contractDetails.verification = !!contractDetails.verification;
        $scope.request.contract_details.verification = !!contractDetails.verification;
        var data = angular.copy($scope.request);
        $scope.contractInProgress = true;
        contractService[!$scope.editContractMode ? 'createContract' : 'updateContract'](data).then(function(response) {
            $state.go('main.contracts.preview.byId', {id: response.data.id});
        }, function() {
            $scope.contractInProgress = false;
        });
    };
    var checkDraftContract = function(redirect) {
        if (localStorage.draftContract && !contract.id) {
            if (!contract.id) {
                var draftContract = JSON.parse(localStorage.draftContract);
                if (draftContract.contract_type == CONTRACT_TYPES_CONSTANTS.AIRDROP) {
                    contract = draftContract;
                }
            }
        }
        resetForm();
        if (localStorage.draftContract && !contract.id && !$rootScope.currentUser.is_ghost) {
            $scope.createContract();
        } else if (redirect && !localStorage.draftContract) {
            $state.go('main.contracts.list');
        }
    };
    checkDraftContract();

    web3Service.setProviderByNumber($scope.network);
    var web3 = web3Service.web3();
    var tokenContractDecimals = 0;


    var tokenData = ['decimals', 'symbol'];

    $scope.checkTokenAddress = function(token_address) {
        tokenContractDecimals = false;
        $scope.checkedTokenAddress = false;
        if (!$scope.request.contract_details.token_address || !web3.utils.isAddress($scope.request.contract_details.token_address.toLowerCase())) {
            return;
        }
        var address = web3.utils.toChecksumAddress($scope.request.contract_details.token_address);
        var web3Contract = web3Service.createContractFromAbi(address, window.abi);

        var checkedTokenData = {};
        var sch = tokenData.length;
        tokenData.map(function(method) {
            web3Contract.methods[method]().call(function(err, result) {
                if (err === null) {
                    checkedTokenData[method] = result;
                    sch--;
                    if (!sch) {
                        $scope.checkedTokenAddress = checkedTokenData;
                        token_address.$setValidity('contract-address', true);
                        $scope.$apply();
                    }
                } else {
                    token_address.$setValidity('contract-address', false);
                    $scope.$apply();
                }
            });
        });
    };
});
