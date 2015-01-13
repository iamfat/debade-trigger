var http = require('http');
var amqp = require('amqplib');

var logger = require('./logger');
var config = require('./config');
var callback = require('./callback');

var start = function() {

    var url = (function() {
        var host = config.mq.host || '127.0.0.1';
        var username = config.mq.username || 'guest';
        var password = config.mq.password || 'guest';
        var port = config.mq.port || '5672';
        return 'amqp://' + username + ':' + password + '@' + host + ':' + port;
    })();

    logger.info('RabbitMQ URL: ' + url);

    var handleMessage = function(pData, pChannel) {
        return function(pMessage) {
            cbk.run(pData, JSON.parse(pMessage.content.toString()), function() {
                pChannel.ack(pMessage);
            });
        };
    };

    // 链接rabbitMQ服务器，接收消息
    var connect = function() {
        
        logger.info('MQ connecting...');
        
        amqp.connect(url).then(function(conn) {

            logger.info('MQ connected.');

            conn.on('close', function() {
                logger.error('MQ connection closed.');
                setTimeout(connect, 1000);
            }).on('error', function(err) {
                logger.error('MQ error: ' + err);
                setTimeout(connect, 1000);
            });

            var ch = conn.createChannel();
            
            Object.keys(config.subscribers).forEach(function(key){
                var subscriber = config.subscribers[key];
                subscriber.channels.forEach(function(channel) {
                    var callback_options = channel.callback;
                    callback_options.secret = subscriber.secret;
                    var exchange = channel.exchange;

                    ch.then(function(ch) {
                        
                        ch.assertExchange(exchange, 'fanout', {
                            durable: false, autoDelete: true
                        })
                        .then(function(){
                            logger.debug("MQ exchange was declared.");
                            return ch.assertQueue('', {
                                exclusive: false, autoDelete: true
                            });
                        })
                        .then(function(ok) {
                            logger.debug("MQ queue was declared.");
                            return ch.bindQueue(ok.queue, exchange, '').then(function(ok){
                                return ok.queue; 
                            });
                        })
                        .then(function(queue) {
                            logger.debug("MQ queue and exchange was binded.");
                            return ch.consume(queue, function(message) {
                                logger.debug("MQ got: " + message.content.toString('utf-8'));
                                callback.of(callback_options).call(message.content.toString('utf-8'));
                                ch.ack(message);
                            }, {noAck: false});
                        });
                        return ch;
                    });
                });
            });

        }, function(err) {
            logger.error('MQ connection error: ' + err);
            setTimeout(connect, 1000);
        }).then(null, console.warn);;
    };

    connect();
};

exports.start = start;
