(function($) {
    $(function() {
        var lastOrder = $.cookie('order');
        if (!lastOrder) return;

        var enterCodeBtn = $('.enter-pay-code', ethereumOrderBlock);
        var orderTimer = $('#order-timer');
        var freeTimeOut = 3600;

        var ethereumOrderBlock = $('#ethereum-order');
        lastOrder = JSON.parse(lastOrder);

        $('.full-price', ethereumOrderBlock).text(lastOrder['fullPrice']);
        ethereumOrderBlock.show();

        var showEnterCodeWindow = function() {
            popupHolder.show();
        };

        var nowTime = (new Date()).getTime();

        var generateNewTime = function() {
            var leftTime = Math.round(freeTimeOut - ((new Date()).getTime() - lastOrder['time'])/1000);
            var minutes = Math.floor(leftTime / 60);
            minutes = ((minutes < 10) ? '0' : '') + minutes;
            var seconds = leftTime % 60;
            seconds = ((seconds < 10) ? '0' : '') + seconds;
            orderTimer.text(minutes + ':' + seconds);
        };
        generateNewTime();
        setInterval(generateNewTime, 400);

        enterCodeBtn.on('click', function() {
            showEnterCodeWindow();
        });

        var popupHolder = $('#pay-confirm-popup');
        var popupCloser = $('#pay-confirm-closer');
        popupCloser.on('click', function(e) {
            if (!$(this).is(e.target)) return;
            popupHolder.hide();
        });
    })
})(jQuery);
