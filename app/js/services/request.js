angular.module('Services').service('requestService', function($http, API) {
    return {

        get: function (params) {
            var url = API.HOSTS.TEST;
            url += params.API_PATH || API.HOSTS.PATH;
            url += params.path || '';

            var httpParams = {};
            httpParams.params = params.params || params.query;
            return $http.get(url, httpParams);
        },


        post: function (params) {
            var url = API.HOSTS.TEST;
            url += params.API_PATH || API.HOSTS.PATH;
            url += params.path || '';

            var requestOptions = {
                method: params.method || 'POST',
                url: url,
                data: params.data
            };
            if (params.headers) {
                requestOptions.headers = params.headers;
            }
            if (params.transformRequest) {
                requestOptions.transformRequest = params.transformRequest;
            }

            return $http(requestOptions);
        }
    }
});
