angular.module('Services').service('WebSocketService', function() {


    var watchMessages = function(e) {
        var data = JSON.parse(e.data);
        switch (data.msg) {
            case 'update_contract':
                callUpdateContractHandler(data.data);
                break;
            default:
                break;
        }
    };

    var updateContractHandlers = {};
    var callUpdateContractHandler = function(data) {
        updateContractHandlers[data.id] ?
            updateContractHandlers[data.id].map(function(handler) {
                handler(data);
            }) : false;
    };

    this.onUpdateContract = function(id, handler) {
        updateContractHandlers[id] = updateContractHandlers[id] || [];
        updateContractHandlers[id].push(handler);
    };

    this.offUpdateContract = function(id, handler) {
        if (updateContractHandlers[id]) {
            updateContractHandlers[id].filter(function(func) {
                return func !== handler;
            });
        }
    };

    this.addHandler = function(handlerName, handler) {

    };

    this.removeHandler = function(handlerName, handler) {

    };




    var client, status;

    var isProduction = (location.host.indexOf('eos.mywish.io') > -1) || (location.host.indexOf('contracts.mywish.io') > -1);

    var openConnection = function() {
        var socketUrl = !isProduction ? 'ws://dev.mywish.io/ws/' : 'wss://contracts.mywish.io/ws/';
        client = new W3CWebSocket(socketUrl);
    };

    this.connect = function(cb) {
        openConnection();
        client.onopen = function() {
            status = true;
        };
        client.binaryType = "blob";
        client.onmessage = watchMessages;
        client.onclose = function() {
            status = false;
        }
    };

    this.disconnect = function() {
        client.close();
    };

    this.status = function() {
        return status;
    };

});
