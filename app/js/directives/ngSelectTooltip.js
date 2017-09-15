var module = angular.module('Directives');
module.directive('ngSelectTooltip', function($timeout) {
    return {
        'restrict': 'A',
        'scope': {
            ngSelectTooltip: '=ngSelectTooltip'
        },
        'controller': function ($scope) {

        },
        'link': function($scope, element) {
            var body = angular.element('body:first');
            var win = angular.element(window);
            var parent = $scope.ngSelectTooltip.parent || element.parent();
            element.detach();
            var oldClass;
            var showTooltip = function() {
                element.css({visibility: ''});
                var pageOffset = body.offset(),
                    containerOffset = parent.offset(),
                    containerHeight = parent.outerHeight(),
                    containerWidth = parent.outerWidth(),
                    parentWidth = parent.outerWidth(),
                    listContainerHeight = element.outerHeight(),
                    listContainerWidth = element.outerWidth();
                var containerOffsetTop = containerOffset['top'];

                switch ($scope.ngSelectTooltip.position) {

                    case 'right':
                        (containerOffset['left'] + containerWidth + listContainerWidth) < win.width() ?
                            element.css({
                                'left': containerOffset['left'] + containerWidth
                            }).addClass(oldClass = 'to-right-list') :
                            element.css({
                                'left': containerOffset['left'] - listContainerWidth
                            }).addClass(oldClass = 'to-left-list');
                        element.css({
                            top: containerOffset['top'] - pageOffset['top']
                        });
                        break;

                    default:
                        element.width(parentWidth);
                        (containerOffsetTop + containerHeight + listContainerHeight) < (win.height() + win.scrollTop()) ?
                            element.css({
                                'top': containerOffsetTop + containerHeight
                            }).addClass(oldClass = 'to-bottom-list') :
                            element.css({
                                'top': containerOffsetTop - listContainerHeight
                            }).addClass(oldClass = 'to-top-list');
                        element.css({
                            left: containerOffset['left'] - pageOffset['left']
                        });
                        break;
                }


            };
            $scope.$watch('ngSelectTooltip.removeTooltip', function(n, o) {
                if (n) {
                    element.detach().remove();
                }
            });

            $scope.$watch('ngSelectTooltip.checker', function(n, o) {
                if (o && !n) {
                    $timeout(function() {
                        element.detach();
                        element.removeClass(oldClass);
                    });
                }
                if (n) {
                    element.appendTo(body);
                    element.css({'left': 0, top: 0, visibility: 'hidden'});
                    $timeout(showTooltip);
                }
            });

            $scope.$on('$destroy', function() {
                element.empty().remove();
            })
        }
    }
});
