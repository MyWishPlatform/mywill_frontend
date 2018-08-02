angular.module('Services').service('WebSocketService', function() {


    var eventsHandlers = {};

    var watchMessages = function(e) {
        var data = JSON.parse(e.data);

        if (eventsHandlers[data.message]) {
            eventsHandlers[data.msg].map(function(handler) {
                handler(data);
            });
        }
    };


    this.addHandler = function(handlerName, handler, unique) {
        var handlersList = eventsHandlers[handlerName] || [];
        if (unique && handlersList.length) return;
        handlersList.push(handler);
        eventsHandlers[handlerName] = handlersList;
    };

    this.removeHandler = function(handlerName, handler) {
        if (!eventsHandlers[handlerName]) return;
        eventsHandlers[handlerName] = eventsHandlers[handlerName].filter(function(handlerCallback) {
            return handlerCallback !== handler;
        });
    };




    var client;

    var onOpenConnection = function(cb) {
        // handlers['open'] ? handlers['open']() : false;
    };


    var openConnection = function() {
        var socketUrl = 'ws://dev.mywish.io/ws/';
        client = new W3CWebSocket(socketUrl);
    };


    this.connect = function(cb) {
        openConnection();
        client.onopen = function() {
            onOpenConnection(cb);
        };
        client.binaryType = "blob";
        client.onmessage = watchMessages;
        client.onclose = function() {
            // onCloseConnection();
        }
    };

    this.destroyConnection = function() {
        client.close();
    };

    // this.connect();
});
