var module = angular.module('Directives');
module.directive('ngScrollList', function($window) {
    return {
        scope: {
            ngScrollList: '='
        },
        restrict: 'A',
        link: function(scope, element) {
            var elementScrolled =
                scope.ngScrollList.parent ? element.parents(scope.ngScrollList.parent + ':first') :
                angular.element($window);

            var onScroll = function() {
                var currentBottomPosition = element.offset()['top'] + element.outerHeight();
                if (!scope.ngScrollList.parent) {
                    currentBottomPosition = currentBottomPosition - elementScrolled.scrollTop() - elementScrolled.height();
                    if (currentBottomPosition < scope.ngScrollList.offset) {
                        scope.ngScrollList.updater ? scope.ngScrollList.updater() : false;
                    }
                } else {
                    var parentBottomPosition = elementScrolled.offset()['top'] + elementScrolled.outerHeight();
                    if ((currentBottomPosition - parentBottomPosition) < scope.ngScrollList.offset) {
                        scope.ngScrollList.updater ? scope.ngScrollList.updater() : false;
                    }
                }
            };
            elementScrolled.on('scroll', onScroll);
            scope.$on('$destroy', function() {
                elementScrolled.off('scroll', onScroll);
            });

        }
    }
});
