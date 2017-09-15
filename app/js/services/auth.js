var module = angular.module('Services');
module.service('authService', function(requestService, API) {
    return {
        registration: function(params) {
            params.API_PATH = API.HOSTS.AUTH_PATH;
            params.path = API.REGISTRATION;
            return requestService.post(params);
        },
        get: function() {
            var params = {
                path: API.USERS
            };
            return requestService.get(params);
        },
        profile: function() {
            var params = {};
            // params.API_PATH = API.HOSTS.ACCOUNTS_PATH;
            params.path = API.PROFILE;
            return requestService.get(params);
        },
        auth: function(params) {
            params.API_PATH = API.HOSTS.AUTH_PATH;
            params.path = API.LOGIN;
            // params.headers = {
            //     'Content-Type': 'application/x-www-form-urlencoded'
            // };
            // params.transformRequest = function(obj) {
            //     var str = [];
            //     for(var p in obj)
            //         str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
            //     return str.join("&");
            // };
            return requestService.post(params);
        },
        adminAuth: function(params) {
            params.API_PATH = params.API_PATH || API.HOSTS.AUTH_PATH;
            params.path = params.path || API.ADMIN_LOGIN;
            params.headers = {
                'Content-Type': 'application/x-www-form-urlencoded'
            };
            params.transformRequest = function(obj) {
                var str = [];
                for(var p in obj)
                    str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
                return str.join("&");
            };
            return requestService.post(params);
        },
        logout: function() {
            var params = {};
            params.API_PATH = API.HOSTS.AUTH_PATH;
            params.path = API.LOGOUT;
            return requestService.get(params);
        },
        passwordReset: function(email) {
            var params = {
                data: {
                    email: email
                }
            };
            params.API_PATH = API.HOSTS.AUTH_PATH;
            params.path = API.PASSWORD_RESET;
            return requestService.post(params);
        },
        passwordChange: function(data) {
            var params = {
                data: data
            };
            params.API_PATH = API.HOSTS.AUTH_PATH;
            params.path = API.PASSWORD_RESET_CONFIRM;
            return requestService.post(params);
        }
    };
});
