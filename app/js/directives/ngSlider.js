angular.module('Directives').directive('ngSlider', function ($rootScope, $timeout) {
    return {
        restrict: 'A',
        scope: {
            ngSlider: "="
        },
        link: function(scope, elem, attrs, ctrl) {
            var items = elem.find(scope.ngSlider.item);
            var container = elem.find(scope.ngSlider.container);
            container.width(100 * items.length + '%');
            var itemWidth = 100 / items.length;
            items.width(itemWidth + '%');
            var controlButtons = angular.element('<div>').addClass('slider_control');
            elem.after(controlButtons);
            var iniControlButton = function(number) {
                var sliderPageBtn = angular.element('<span>').addClass('slider_control__one-slide');
                sliderPageBtn.on('click', function() {
                    activateSlide(number);
                }).on('mousedown touchstart', function() {
                    return false;
                });
                return sliderPageBtn;
            };
            var controlBtns = [];
            for (var k = 0; k < items.length; k++) {
                var sliderPageBtn = iniControlButton(k);
                controlBtns.push(sliderPageBtn);
                controlButtons.append(sliderPageBtn);
            }
            var activeSlide = 0;
            var activateSlide = function(slideNumber) {
                slideNumber = Math.max(0, Math.min(slideNumber, items.length - 1));

                controlBtns[activeSlide].removeClass('active');
                controlBtns[slideNumber].addClass('active');

                container.css({
                    transform: 'translateX(' + (- itemWidth * slideNumber) + '%)'
                });
                if (slideNumber == 0) {
                    prevSlideButton.addClass('no-active');
                } else if (activeSlide == 0) {
                    prevSlideButton.removeClass('no-active');
                }
                if (slideNumber == (items.length - 1)) {
                    nextSlideButton.addClass('no-active');
                } else if (activeSlide == (items.length - 1)) {
                    nextSlideButton.removeClass('no-active');
                }
                activeSlide = slideNumber;
            };

            var nextSlideButton = angular.element('<span>').addClass('slider_big_control slider_big_control__next icon-keyboard_arrow_right');
            var prevSlideButton = angular.element('<span>').addClass('slider_big_control slider_big_control__prev icon-keyboard_arrow_left');
            nextSlideButton.on('click', function() {
                activateSlide(activeSlide + 1);
            }).on('mousedown touchstart', function() {
                return false;
            });
            prevSlideButton.on('click', function() {
                activateSlide(activeSlide - 1);
            }).on('mousedown touchstart', function() {
                return false;
            });
            elem.append(nextSlideButton, prevSlideButton);

            activateSlide(0);

            var startDownPosition;
            var lastPosition;
            var downSlide = function(e) {
                e.preventDefault();
                var clientX = 0;
                if (e.targetTouches && e.targetTouches.length) {
                    clientX = e.targetTouches[0].clientX;
                } else {
                    clientX = e.clientX;
                }
                startDownPosition = clientX;
                container.addClass('no-transition');
                angular.element(window).on('mousemove touchmove', moveWindow);
                angular.element(window).on('mouseup touchend', upSlide);
            };
            var upSlide = function(e) {
                container.css({
                    transform: 'translateX(calc(' + (- itemWidth * activeSlide) + '% + ' + changedPosition + 'px))',
                    marginLeft: 0
                });
                var endDownPosition = lastPosition - startDownPosition;
                var addSlides = -Math.round(endDownPosition / (items.eq(0).width()));


                $timeout(function() {
                    container.removeClass('no-transition');
                    activateSlide(activeSlide + addSlides);
                }, 10);

                angular.element(window).off('mousemove touchmove', moveWindow);
                angular.element(window).off('mouseup touchend', upSlide);
            };

            var changedPosition ;
            var moveWindow = function(e) {
                if (e.targetTouches && e.targetTouches.length) {
                    lastPosition = e.targetTouches[0].clientX;
                } else {
                    lastPosition = e.clientX;
                }
                changedPosition = lastPosition - startDownPosition;
                container.css({
                    marginLeft: changedPosition
                });
            };

            elem.on('mousedown touchstart', downSlide);
            scope.$on('$destroy', function() {
                elem.off('mousedown touchstart', downSlide);
            });
        }
    }
});
