angular.module('app').controller('apiDevsController', function(contractService, $scope, APIKeysService) {

    $scope.apiFormPopUpData = {
        apiFormRequest: {},
        createTokenProgress: false
    };


    $scope.submitApiForm = function(callback) {
        $scope.apiFormPopUpData.createTokenProgress = true;
        APIKeysService.createToken($scope.apiFormPopUpData.apiFormRequest).then(function(response) {
            $scope.tokensList.push(response.data);
            callback ? callback() : false;
            response.data.isNew = true;
            $scope.showToken(response.data);
            $scope.apiFormPopUpData.createTokenProgress = true;
            $scope.apiFormPopUpData.apiFormRequest = {};
        });
    };



    APIKeysService.getTokens().then(function(response) {
        $scope.tokensList = response.data.tokens;
    }, console.log);

    var deleteToken = function(tokenKey) {
        $scope.deletePopupParams.progress = true;
        if (tokenKey) {
            $scope.tokensList = $scope.tokensList.filter(function(token) {
                return token.token !== tokenKey;
            });
            APIKeysService.deleteToken(tokenKey).then(function() {
                $scope.deletePopupParams.progress = false;
            }, function() {
                $scope.deletePopupParams.progress = false;
            })
        } else {
            $scope.tokensList = [];
            APIKeysService.deleteTokens().then(function() {
                $scope.deletePopupParams.progress = false;
            }, function() {
                $scope.deletePopupParams.progress = false;
            })
        }
    };

    $scope.deletePopupParams = {
        method: deleteToken,
        progress: false
    };


    $scope.showToken = function(token) {
        $scope.showedToken = token;
    };

    $scope.resetShowedToken = function() {
        $scope.showedToken = false;
    };

    $scope.hideShow = function(field) {
        var inputType = field.$$element.attr('type');
        field.$$element.attr('type', inputType === 'password' ? 'text' : 'password');
    }
});
