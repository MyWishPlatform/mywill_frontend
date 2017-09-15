var module = angular.module('Directives');
module.directive('ngScrolledBlock', function($timeout) {

    var scrollTestDiv = angular.element('<div>').css({overflow: 'scroll', clear: 'both'});
    var noScrolled = angular.element('<div>').appendTo(scrollTestDiv);


    var body = angular.element('body').append(scrollTestDiv);

    var scrollSize = body.width() - noScrolled.width();
    scrollTestDiv.detach().remove();

    return {
        'restrict': 'A',
        'scope': {
            ngScrolledBlock: '=?ngScrolledBlock'
        },
        'link': function ($scope, element) {
            var win = angular.element(window);
            var defaultParams = {
                type: 'items',
                itemsCount: 5,
                itemSelector: 'li'
            };
            var container = angular.element('<div>').css({
                position: 'relative',
                overflow: 'hidden'
            });
            var scrolledContainer = angular.element('<div>').css({
                overflow: 'scroll',
                marginRight: -scrollSize,
                marginBottom: -scrollSize
            }).appendTo(container);
            element.before(container);
            scrolledContainer.append(element);

            var mouseWheelScrolledBlock = function (e) {
                var event = e.originalEvent;
                var deltaY = event.deltaY || (event.wheelDelta ? -event.wheelDelta : event.detail);
                if (((deltaY > 0) && (scrolledContainer.scrollTop() + container.height() >= element.height())) || (deltaY < 0 && scrolledContainer.scrollTop() == 0)) {
                    e.preventDefault();
                }
            };

            element.on("mousewheel DOMMouseScroll", mouseWheelScrolledBlock);

            var scrollLine =
                angular.element("<div>").addClass("fn-scroller-line");
            var scrollLineContainer =
                angular.element("<div>").addClass("scroller-line-container").appendTo(scrollLine);
            var scrollRanger =
                angular.element("<div>").addClass("scroller-ranger").appendTo(scrollLineContainer);

            var oldScroll;
            var onChangeScroll = function() {
                oldScroll = scrolledContainer.scrollTop();
                var wheeled = scrolledContainer.scrollTop() / defaultParams.listHeight * 100;
                scrollRanger.css("margin-top", defaultParams.scrollHeight / 100 * wheeled);
            };
            scrolledContainer.on('scroll', onChangeScroll);

            var iniRangeLine = function () {
                defaultParams.listHeight = element.outerHeight();
                defaultParams.containerHeight = container.outerHeight();
                defaultParams.scrollHeight = scrollLine.height();
                defaultParams.percentsHeight = Math.min(defaultParams.maxHeight / defaultParams.listHeight * 100, 100);
                scrollRanger.height(defaultParams.percentsHeight + '%');
            };

            var heightScrollBlockIni = function() {
                defaultParams.maxHeight = 300; //defaultParams.children.first().outerHeight() * defaultParams.itemsCount;
                if (defaultParams['showed']) {
                    scrolledContainer.scrollTop(oldScroll);
                }
                if (defaultParams.children.length > defaultParams.itemsCount) {
                    if (defaultParams['showed']) {
                        element.addClass('scrolled-block');
                        scrollLine.prependTo(container);
                        scrolledContainer.css({'max-height': defaultParams.maxHeight + scrollSize});
                        defaultParams['activeItem'] ? iniAutoScroll() : false;
                        iniRangeLine();
                    }
                } else {
                    element.removeClass('scrolled-block');
                    scrollLine.detach();
                }
            };

            $scope.$watch('ngScrolledBlock', function() {
                angular.extend(defaultParams, $scope.ngScrolledBlock);
                defaultParams.children = element.find(defaultParams.itemSelector);
            });

            var iniAutoScroll = function () {
                var position = defaultParams['activeItem'] ? defaultParams['activeItem'].offset()['top'] : 0,
                    minPosition = container.offset()['top'],
                    maxPosition = minPosition + defaultParams.containerHeight - (defaultParams['activeItem'] ? defaultParams['activeItem'].outerHeight(true) : 0);
                var offset = position < minPosition ? position - minPosition : position > maxPosition ? position - maxPosition : 0;
                scrolledContainer.scrollTop(scrolledContainer.scrollTop() + offset);
            };

            $scope.$watch('ngScrolledBlock.showed', function(n) {
                heightScrollBlockIni();
            });

            $scope.$watch('ngScrolledBlock.activeItemIndex', function(n) {
                if ((defaultParams['activeItemIndex'] !== undefined) && defaultParams['activeItemIndex'] > -1) {
                    defaultParams['activeItem'] = defaultParams.children.eq(defaultParams['activeItemIndex']);
                } else {
                    delete defaultParams['activeItem'];
                }
                if (defaultParams['showed']) {
                    iniAutoScroll();
                }
            });

            /** Watchers of scope params **/

            $scope.$watch('ngScrolledBlock.watcher', function() {
                oldScroll = 0;
                heightScrollBlockIni();
            });

            var startClientY = 0, scrollPosition;
            var downRanger = function(e) {
                e.preventDefault();
                startClientY = e.clientY;
                scrollPosition = scrolledContainer.scrollTop();
                win.on({
                    mousemove: moveRanger,
                    mouseup: endMove
                });
                return false;
            };
            var moveRanger = function(e) {
                var rangeMove = e.clientY - startClientY;
                scrolledContainer.scrollTop(scrollPosition + rangeMove * (defaultParams.listHeight / defaultParams.scrollHeight));
            };
            var endMove = function() {
                win.off({
                    mousemove: moveRanger,
                    mouseup: endMove
                });
            };
            scrollRanger.on({"mousedown": downRanger});
        }
    }
});