angular.module('app').controller('extDevsController', function(contractService, $scope, APIKeysService) {
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




    $scope.apiFormRequest = {};
    $scope.submitApiForm = function() {
        console.log($scope.apiFormRequest);
        APIKeysService.createToken({
            comment: '123123'
        }).then(123);
    };
});
