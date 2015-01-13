var fs = require('fs');
var argv = require("optimist").argv;
var conf_file = process.env.DEBADE_CONF || argv.c || './config/debade.yml';
var config = {};
var yaml = require('js-yaml');

if (fs.existsSync(conf_file)) {
    config = yaml.safeLoad(fs.readFileSync(conf_file, {encoding:'utf-8'}));
}

module.exports = config;
