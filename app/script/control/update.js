/**
 * Auhor: chengjun.hecj
 * Descript:
 */

var http = require('http'),
    fs = require('fs'),
    url = require('url'),
    AdmZip = require('adm-zip'),

    exec = require('child_process').exec;


var Req = {
    init: function (callback) {
        var config = global.config;
        var data = JSON.stringify({
            name: config.name
        });

        var options = {
            hostname: config.update.hostname,
            path: '/update',
            method: 'POST',
            headers: {
                Connection: 'keep-alive',
                Accept: 'text/html, application/xhtml+xml, */*',
                'Accept-Language': 'zh-CN',
                'Content-Type': 'application/json',
                'Content-Length': data.length
            }
        };
        var req = http.request(options, function (res) {
            res.setEncoding('utf8');
            res.on('data', function (chunk) {
                var data = JSON.parse(chunk);
                if (data.success && data.data) {
                    if (data.data.currentVersion != config.version)
                        callback(data.data);
                }
            });
        });

        req.on('error', function (e) {
            console.log('problem with request: ' + e.message);
        });

        req.write(data + '\n');
        req.end();
    },
    getZip: function (link,callback) {
        var rootPath = fs.realpathSync('.');
        var per = 0;
        http.get(link, function (res) {
            var data = [], dataLen = 0;
            var total = res.headers['content-length'];
            callback(per,total);
            res.on('data',function (chunk) {
                data.push(chunk);
                dataLen += chunk.length;
                per += chunk.length;
                callback(per,total);
            }).on('end', function () {
                    var buf = new Buffer(dataLen);
                    for (var i = 0, len = data.length, pos = 0; i < len; i++) {
                        data[i].copy(buf, pos);
                        pos += data[i].length;
                    }
                    var zip = new AdmZip(buf);
                    zip.extractAllTo(rootPath, true);
                });
        });
    }
};

module.exports = Req;