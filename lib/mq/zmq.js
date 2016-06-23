var ZeroMQ = require("zmq");

var logger = require('../logger');
var config = require('../config');
var callback = require('../callback');

var start = function() {

    var url = (function() {
        var host = config.mq.host || '127.0.0.1';
        var port = config.mq.port || '5672';
        return 'tcp://' + host + ':' + port;
    })();

    function connect() {
        logger.info('MQ connecting...');
        var socket = ZeroMQ.socket("subscriber");
        socker.connect(url, function (err) {
            if (err) connect();
        
            logger.info('MQ connected.');

            socket
            .on("message", function (id, data) {

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
        
        });
    }
    

            Object.keys(config.subscribers).forEach(function(key){
                var subscriber = config.subscribers[key];
                subscriber.channels.forEach(function(channel) {
                    var callback_options = channel.callback;
                    callback_options.secret = subscriber.secret;
                    var exchange = channel.exchange;
                    var type = channel.type || 'fanout';
                    var routing_keys = channel.routing_keys || [''];
                    var log_prefix = "[" + key + "/" + exchange + "]: ";

                    logger.debug(log_prefix + "creating MQ channel");
                    conn.createChannel().then(function(ch) {
                        logger.debug(log_prefix + "declare MQ exchange");
                        
                        var ok = ch.assertExchange(exchange, type, {
                            durable: false, autoDelete: true
                        });

                        ok.then(function(){
                            logger.debug(log_prefix + "declare MQ queue");
                            return ch.assertQueue('', {
                                exclusive: false, autoDelete: true
                            });
                        })
                        .then(function(qok) {
                            var queue = qok.queue;
                            logger.debug(log_prefix + "bind MQ queue:" + queue.toString() + " and exchange");
                            return all(routing_keys.map(function(routing_key){
                                ch.bindQueue(queue, exchange, routing_key);
                            })).then(function(){
                                return queue;
                            });
                        })
                        .then(function(queue) {
                            ch.prefetch(1);
                            return ch.consume(queue, function(message) {
                                if (message === null) return;

                                var tag = message.fields.consumerTag
                                    + '/' + message.fields.deliveryTag;

                                logger.debug(log_prefix + tag + ": "
                                    + message.content.toString('utf-8'));
                                var data = message.content.toString('utf-8');
                                try { data = JSON.parse(data); } catch (e) {}

                                function _ack() {
                                    logger.debug(log_prefix + tag + ' ACK');
                                    ch.ack(message);
                                }

                                function _nack() {
                                    logger.debug(log_prefix + tag + ' NACK');
                                    ch.ack(message);
                                }

                                callback.of(callback_options).call(data)
                                .done(_ack, _nack);
                            });
                        })
                        .then(function(){
                            logger.debug(log_prefix + "accepting messages...");
                        });

                    });
                });
            });

        }, function(err) {
            logger.error('MQ connection error: ' + err);
            setTimeout(connect, 5000);
        }).then(null, console.warn);;
    };

    connect();
};

exports.start = start;

