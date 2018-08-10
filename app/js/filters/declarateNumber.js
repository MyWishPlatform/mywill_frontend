angular.module('Filters').filter('declNumber', function($filter) {
    return function(value, words) {
        var float = value % 1;
        value = Math.floor(Math.abs(value));
        var cases = [2, 0, 1, 1, 1, 2];
        return words[float ? 1 : (value % 100 > 4 && value % 100 < 20) ? 2 : cases[(value % 10 < 5) ? value % 10 : 5]];
    }
});