angular.module('Directives').directive('ngSlider', function ($timeout) {
    return {
        restrict: 'A',
        scope: {
            ngSlider: "="
        },
        link: function(scope, elem, attrs, ctrl) {
            var items = elem.find(scope.ngSlider.item);
            var container = elem.find(scope.ngSlider.container);
            container.width(100 * items.length + '%');
            items.width(100 / items.length + '%');


            var controlButtons = angular.element('<div>').addClass('slider_control');
            for (var k = 0; k < items.length; k++) {
                var sliderPageBtn = angular.element('<span>').addClass('slider_control__one-slide');
                controlButtons.append(sliderPageBtn);
            }
        }
    }
});
