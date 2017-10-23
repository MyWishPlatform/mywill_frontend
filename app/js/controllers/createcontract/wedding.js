angular.module('app').controller('weddingCreateController', function(contractService, $scope) {
    $scope.request = {
        contract_name: 'wedding'
    };
    $scope.sendForm = function(form) {
        if (!form.$valid) return;
        contractService.sendSentences($scope.request).then(function() {
            $scope.formRequestSuccess = true;
        });
    };

    $scope.resetForm = function() {
        $scope.request = {
            contract_name: 'wedding'
        };
        $scope.formRequestSuccess = false;
    };
});

