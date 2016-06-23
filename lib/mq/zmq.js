var ZeroMQ = require("zmq");

var logger = require('../logger');
var config = require('../config');
var callback = require('../callback');

var start = function() {

    var address = (function() {
        var host = config.mq.host || '127.0.0.1';
        var port = config.mq.port || '3334';
        return 'tcp://' + host + ':' + port;
    })();

    var socket = ZeroMQ.socket("sub");
    socket.connect(address);
    socket.subscribe("");

    logger.info('MQ connected to ' + address);

    socket
    .on("message", function (data) {

        logger.debug("MQ <= "
            + data.toString('utf-8'));
        try { data = JSON.parse(data); } catch (e) {}

        Object.keys(config.subscribers).forEach(function(key){
            var subscriber = config.subscribers[key];
            subscriber.channels.forEach(function(channel) {
                var callback_options = channel.callback;
                callback_options.secret = subscriber.secret;

                function _ack() {}

                callback.of(callback_options).call(data)
                .done(_ack, _ack);

            });
        });

    });
    
};

exports.start = start;

