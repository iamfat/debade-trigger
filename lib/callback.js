var logger = require('./logger');

var Callback = function(options) {
    this.options = options;
};

var _RPC = {};
Callback.prototype.getRPC = function(url) {
    if (!_RPC[url]) {
        var self = this;
        var rpc = require('http-jsonrpc').connect(url);
        rpc.logger = logger;
        rpc.on('beforeRequest', function(options, data) {
            options.headers['X-DeBaDe-Token'] 
                = require('crypto').createHmac('sha1', self.options.secret.toString())
                .update(data).digest('base64');
        });
        _RPC[url] = rpc;
    }
    return _RPC[url];
};

Callback.prototype.call = function(message) {
    var self = this;
    switch (self.options.type) {
    case 'http-jsonrpc':
    default:
        self.getRPC(self.options.url).notify(self.options.method, [message]);
    }
};

var _CALLBACKS = {};
exports.of = function(options) {
    var hash = require('crypto').createHash('sha1').update(JSON.stringify(options)).digest('base64');
    if (!_CALLBACKS[hash]) {
        _CALLBACKS[hash] = new Callback(options);
    }
    return _CALLBACKS[hash];
};