angular.module('Filters').filter('separateNumber', function() {
    return function(val) {
        val = (val || '') + '';
        var values = val.split('.');
        while (/(\d+)(\d{3})/.test(values[0].toString())){
            values[0] = values[0].toString().replace(/(\d+)(\d{3})/, '$1'+','+'$2');
        }
        return values.join('.');
    }
});
