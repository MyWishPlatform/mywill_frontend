angular.module('Services').service('usersService', function(requestService, API) {
    return {
        getList: function (filters) {
            var params = {
                path: API.USERS,
                params: filters
            };
            requestService.get(params);
        },
        getUser: function (id, success, error) {
            var params = {
                path: API.USERS + id + '/'
            };
            requestService.get(params);
        },
        saveUser: function(data) {
            var params = {
                data: data,
                path: API.USERS + (data.id ? data.id + '/' : ''),
                method: data.id ? 'PATCH' : false
            };
            requestService.post(params);
        },
        updateUserParam: function(data) {
            var params = {
                data: data,
                path: API.USERS + id + '/',
                method: 'PATCH'
            };
            requestService.post(params);
        }
    }
});