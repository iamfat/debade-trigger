#! /usr/bin/env node

var logger = require('./lib/logger');

logger.info(">> DeBaDe Trigger Server <<");

logger.info("Subscribing MQ server...");
require('./lib/mq').start();
