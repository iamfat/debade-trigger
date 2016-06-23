var logger = require('../logger');
var config = require('../config');
var callback = require('../callback');

var start = function() {

    var url = (function() {
        var host = config.mq.host || '127.0.0.1';
        var port = config.mq.port || '11300';
        return host + ':' + port;
    })();

    logger.info('Beanstalk URL: ' + url);

    var bs = require('nodestalker'),
        client = bs.Client(url),
        tube = config.mq.tube || 'default';

    logger.info('MQ connected.');

    client.watch(tube).onSuccess(function(message) {
        
        function _reserve() {
            client.reserve().onSuccess(function(job) {
                var data = job.data;
                logger.debug('MQ => ' + data);
                try { data = JSON.parse(data); } catch (e) {}

                client.deleteJob(job.id);

                Object.keys(config.subscribers).forEach(function(key){
                    var subscriber = config.subscribers[key];
                    subscriber.channels.forEach(function(channel) {
                        var callback_options = channel.callback;
                        callback_options.secret = subscriber.secret;

                        callback.of(callback_options)
                            .call(data)
                            .done(_reserve, _reserve);
                    });
                });

            });
        }

        _reserve();
    });

};

exports.start = start;

