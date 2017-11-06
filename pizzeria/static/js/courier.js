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


        $('#success-order').on('click', function() {
            $.ajax({
                type: 'GET',
                url: '/api/v1/profile/'
            }).done(function() {
                var allCookies = document.cookie.split(';');
                var parsedCookie = {};
                allCookies.map(function(elem) {
                    var keyValue = elem.split('=');
                    parsedCookie[keyValue[0]] = keyValue[1];
                });

                $.ajax({
                    type: 'POST',
                    url: '/api/v1/pizza_delivered/',
                    data: JSON.stringify({
                        'order_id': lastOrder.orderId,
                        'code': $('#code-value').val() * 1
                    }),
                    headers: {
                        'Content-Type': 'application/json;charset=UTF-8',
                        'X-CSRFToken': parsedCookie['csrftoken']
                    }
                }).done(function() {
                    alert('Order is confirmed');
                }).fail(function() {
                    alert('Что-то пошло не так');
                });
            }).fail(function() {
                console.log(arguments);
            });
        });




    })
})(jQuery);
