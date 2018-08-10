angular.module('Filters').filter('isEmail', function($filter) {
    return function(email) {
        var input = angular.element('<input>').attr({type: 'email'});
        input.val(email);
        return input.get(0).validity.valid;
    }
});