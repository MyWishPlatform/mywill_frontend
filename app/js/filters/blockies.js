angular.module('Filters').filter('blockies', function() {
    return function(val) {
        return blockies.create({
            seed: val.toLowerCase(),
            size: 8,
            scale: 3
        }).toDataURL();
    }
});
