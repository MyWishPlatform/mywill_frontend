angular.module('app').controller('solanaAddTokenController', function ($scope){
    $scope.isValidFile = true;
    $scope.filePlaceHolder = "Upload toke logo file";
    $scope.isFileEmpty = true;
    var file;
    $scope.setFile = function(event){
        $scope.$apply(function(){
            file = event.target.files[0];
            if (!file) {
                $scope.isFileEmpty = true;
                return;
            }
            $scope.isFileEmpty = false;
            $scope.filePlaceHolder = file.name.length > 16 ? file.name.split('.')[0].slice(0, 15) + '...' + file.name.split('.')[1] : file.name;
            if (file.size > 200 * 1024 || !file.type.match(/^image/)) {
                $scope.isValidFile = false;
                return;
            }
            else {
                $scope.isValidFile = true;
            }
        })
    }

    $scope.sendTokenInfo = function(){
        var reader = new FileReader();
        reader.onload = function(e){
            var formData = {
                "details": $scope.contract.contract_details,
                "logo": e.target.result,
                "site_link": $scope.link,
                "coingecko_id": $scope.coingecko,
                "description": $scope.description,
                "disc_link": $scope.discord,
                "twitter_link": $scope.twitter,
            }
        }
        reader.readAsBinaryString(file);
    }
});