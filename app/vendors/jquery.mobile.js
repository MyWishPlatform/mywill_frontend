(function($) {
    $.fn.addTouch = function() {
        return this.each(function(i, el) {
            $(el).bind('touchstart touchmove touchend touchcancel',function() {
                var touches = event['changedTouches'],
                    first = touches[0],
                    type = '';
                switch(event.type) {
                    case 'touchstart':
                        type = 'mousedown';
                        break;
                    case 'touchmove':
                        type = 'mousemove';
                        event.preventDefault();
                        break;
                    case 'touchend':
                        type = 'mouseup';
                        break;
                    case 'touchcancel':
                        type = 'mouseup';
                        break;
                    default:
                        return;
                }
                var simulatedEvent = document.createEvent('MouseEvent');
                simulatedEvent.initMouseEvent(type, true, true, window, 1, first.screenX, first.screenY, first.clientX, first.clientY, false, false, false, false, 0/*left*/, null);
                first.target.dispatchEvent(simulatedEvent);
            });
        });
    };
})(jQuery);
