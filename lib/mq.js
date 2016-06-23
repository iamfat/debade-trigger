var config = require('./config');
var driver = config.mq.driver || 'rabbitmq';
exports.start = require('./mq/' + driver).start;

