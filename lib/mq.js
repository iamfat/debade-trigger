var http = require('http');
var amqp = require('amqplib');
var all = require('when').all;

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

            Object.keys(config.subscribers).forEach(function(key){
                var subscriber = config.subscribers[key];
                subscriber.channels.forEach(function(channel) {
                    var callback_options = channel.callback;
                    callback_options.secret = subscriber.secret;
                    var exchange = channel.exchange;
                    var type = channel.type || 'fanout';
                    var routing_keys = channel.routing_keys || [''];

                    logger.debug("creating MQ channel");
                    conn.createChannel().then(function(ch) {
                        logger.debug("declare MQ exchange");
                        
                        var ok = ch.assertExchange(exchange, type, {
                            durable: false, autoDelete: true
                        });

                        ok.then(function(){
                            logger.debug("declare MQ queue");
                            return ch.assertQueue('', {
                                exclusive: false, autoDelete: true
                            });
                        })
                        .then(function(qok) {
                            logger.debug("bind MQ queue and exchange");
                            var queue = qok.queue;
                            return all(routing_keys.map(function(routing_key){
                                ch.bindQueue(queue, exchange, routing_key);
                            })).then(function(){
                                return queue;
                            });
                        })
                        .then(function(queue) {
                            return ch.consume(queue, function(message) {
                                logger.debug("MQ got: " 
                                    + message.content.toString('utf-8'));
                                var data = message.content.toString('utf-8');
                                try { data = JSON.parse(data); } catch (e) {}
                                callback.of(callback_options).call(data);
                                // ch.ack(message);
                            }, {noAck: true});
                        })
                        .then(function(){
                            logger.debug("accepting messages...");
                        });

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

