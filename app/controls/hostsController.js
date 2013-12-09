/**
 * Auhor: chengjun.hecj
 * Descript:
 */
var fs = require('fs'),
    path = require('path');


var hosts = {
    get: function () {
        var content = '';

        var hostsPath = path.join('../test.txt');
        if(fs.existsSync(hostsPath)){
            content = fs.readFileSync(hostsPath)
        }else

        return content;
    },
    save: function () {
        var hostsPath = path.join('/etc/hosts');
        fs.stat(hostsPath, function (err, exists) {
            if (err) {

            } else {
                return fs.readFileSync(hostsPath);
            }
        });
    }
};


module.exports = hosts;