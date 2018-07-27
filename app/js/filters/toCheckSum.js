angular.module('Filters').filter('toCheckSum', function() {
    return function(val) {
        try {
            return Web3.utils.toChecksumAddress(val);
        } catch (err) {
            return val;
        }
    }
});
