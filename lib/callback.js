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

var _Beans = {};
Callback.prototype.getBeans = function(url) {
    if (!_Beans[url]) {
        var self = this;
        var bs = require('nodestalker'),
            client = bs.Client(url);

        _Beans[url] = client;
    }
    return _Beans[url];
};

Callback.prototype.call = function(message) {
    var self = this;
    switch (self.options.type) {
    case 'beanstalk':
        var client = self.getBeans(self.options.url);
        client.use(self.options.tube).onSuccess(function(data) {
            //beanstalk 中直接传递 object, 会导致变为 [object Object]
            //此处进行 json encode
            //consumer 进行 json decode 解决该问题
            client.put(JSON.stringify(message));
        });
        break;
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
