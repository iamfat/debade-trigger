var logger = require('./lib/logger');

logger.info(">> DeBaDe Agent Server <<");

logger.info("Subscribing MQ server...");
require('./lib/mq').start();
