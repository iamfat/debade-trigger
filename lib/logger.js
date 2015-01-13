var Winston = require('winston');
var config = require('./config');

var logger = new Winston.Logger({
    transports: [
        new Winston.transports.Console({level: config.debug ? "debug" : "error", colorize:true})
    ]
});

module.exports = logger;
