$(window).ready(function(){
    $('#mobile-menu-btn').on('click', function(){
        $(this).toggleClass('active-mobile-menu')
    });
});

var path = window.location.pathname.split('/');
if (path[1] == 'reset') {
    window.location.href = '/auth/reset-password/' + path[2] + '/' + path[3];
}

$.ajax({
    action: 'get',
    url: '/api/v1/profile/',
    success : function(data) {
        if (data.username && !data.is_ghost) {
            location.href = '/dashboard/';
        } else if (data.is_ghost) {
            $('.invisible-content').removeClass('invisible-content');
        }
    },
    error: function() {
        $('.invisible-content').removeClass('invisible-content');
    }
});
