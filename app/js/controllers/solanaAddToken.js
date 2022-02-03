angular.module('app').controller('solanaAddTokenController', function($scope){
    $scope.isValidFile = true;
    $scope.filePlaceHolder = "Upload toke logo file";
    $scope.isFileEmpty = true;
    $scope.setFile = function(event){
        $scope.$apply(function(){
            var file = event.target.files[0];
            if (!file) {
                $scope.isFileEmpty = true;
                return;
            }
            $scope.isFileEmpty = false;
            if (file.size > 200 * 1024 || !file.type.match(/^image/)) {
                $scope.isValidFile = false;
                $scope.filePlaceHolder = file.name;
                return;
            }
            else {
                $scope.isValidFile = true;
                $scope.filePlaceHolder = file.name;
            }
        })
    }
});