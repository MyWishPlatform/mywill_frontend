angular.module('Filters').filter('toCheckSum', function() {
    return function(val, low) {
        try {
            return low ? Web3.utils.toChecksumAddress(val).toString().toLowerCase() : Web3.utils.toChecksumAddress(val);
        } catch (err) {
            return low ? val.toString().toLowerCase() : val;
        }
    }
});
