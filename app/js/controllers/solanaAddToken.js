angular.module('app').controller('solanaAddTokenController', function ($http, $scope, requestService, API){
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
            if (file.size > 200 * 1024 || !(file.type.match(/^image/) && (file.type.match(/\/svg\+xml$/) || file.type.match(/\/png$/) || file.type.match(/\/jpeg$/)))){
                $scope.isValidFile = false;
                return;
            }
            else {
                $scope.isValidFile = true;
            }
        })
    }

    function getCookie(name) {
        if (!document.cookie) {
            return null;
        }

        const xsrfCookies = document.cookie.split(';')
            .map(function(c){return c.trim()})
            .filter(function(c){return c.startsWith(name + '=')});

        if (xsrfCookies.length === 0) {
            return null;
        }
        return decodeURIComponent(xsrfCookies[0].split('=')[1]);
    }
    $scope.sendTokenInfo = function(contract){
        // var form = document.querySelector("#solanaFormAddToken");
        var formData = new FormData();
        formData.append("site_link", $scope.link);
        formData.append("coingecko_id", $scope.coingecko);
        formData.append("description", $scope.description);
        formData.append("disc_link", $scope.discord);
        formData.append("twitter_link", $scope.twitter);
        formData.append("contract_id", contract.id);
        formData.append("logo", file);
        requestService.post({ data: formData, path: API.SEND_TOKEN_INFO, headers: { 'Content-Type': 'application/x-www-form-urlencoded'}});
        // var reader = new FileReader();
        // console.log(contract);
        // reader.onload = function(e){
            
        //     var formData = {
        //         "details": contract.contract_details,
        //         "logo": e.target.result,
        //         "site_link": $scope.link,
        //         "coingecko_id": $scope.coingecko,
        //         "description": $scope.description,
        //         "disc_link": $scope.discord,
        //         "twitter_link": $scope.twitter,
        //     }
        //     console.log(formData);
        //     requestService.post({ data: formData, path: API.SEND_TOKEN_INFO})
        //     //здесь будет отправка через request-сервис
        // }
        // reader.readAsBinaryString(file);
    }
});