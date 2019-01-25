angular.module('app').controller('customCreateController', function(contractService, $scope) {
    $scope.request = {
        contract_name: 'custom',
        username: 'Custom Contract'
    };
    $scope.sendForm = function(form) {
        if (!form.$valid) return;
        contractService.sendSentences($scope.request).then(function() {
            $scope.formRequestSuccess = true;
        });
    };

    $scope.resetForm = function() {
        $scope.request = {
            contract_name: 'custom',
            username: 'Custom Contract'
        };
        $scope.formRequestSuccess = false;
    };
});

