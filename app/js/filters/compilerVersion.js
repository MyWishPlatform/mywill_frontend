angular.module('Filters').filter('compilerVersion', function() {
    return function(val) {
        if (!val) {
            return val;
        }
        return val.replace(/^([^\+]+)(\+commit\.[^\.]+).*$/, '$1$2');
    }
});
