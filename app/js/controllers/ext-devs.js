angular.module('app').controller('extDevsController', function(contractService, $scope) {
    $scope.request = {};
    $scope.sendForm = function(form) {
        if (!form.$valid) return;
        contractService.sendSentences($scope.request).then(function() {
            $scope.formRequestSuccess = true;
        });
    };

    $scope.resetForm = function() {
        $scope.request = {};
        $scope.formRequestSuccess = false;
    };
});
