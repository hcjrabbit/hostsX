/**
 * Auhor: chengjun.hecj
 * Descript:
 */
var exec = require('child_process').exec,
    iconv = require('iconv-lite'),
    fs = require('fs'),
    path = require('path');

var rootPath = path.join(fs.realpathSync('.'));

var dns = {
    changeDnsSh: path.join(rootPath, 'app/script/control', 'changeDns.sh'),
    sys : global.sys,
    dnsPath : global.config.dnsPath,
    getMachineDns: function (callback) {
        var content = '';
        if (dns.sys == 'Mac') {
            if (fs.existsSync(dns.dnsPath)) {
                content = fs.readFileSync(dns.dnsPath, 'utf-8');
                content = /\nnameserver (.*)\n/g.exec(content) || /\nnameserver .*/g.exec(content);
                callback(null, content ? content[1] : '0.0.0.0');
            } else {
                callback('找不到DNS配置文件！');
            }
        } else if (dns.sys == 'Windows') {
            exec('ipconfig /all |find /i "dns"', {encoding: 'utf8'}, function (error, stdout) {
                if (error) {
                    callback('出错啦！！');
                    return false;
                }
                content = /DNS 服务器.*: (.*)\r\n/g.exec(stdout);
                callback(null, content ? content[1] : '0.0.0.0');
            });
        }
    },
    getMachineNetName: function (callback) {
        var names = [];
        if (this.sys == 'Mac') {
            exec('networksetup -listallnetworkservices', {encoding: 'utf8'}, function (err, stdout, stdin) {
                if (err)
                    console.log(err);
                names = stdout.split('\n');
                names.shift();
                names.pop();
                callback(names);
            });
        } else {
            exec('netsh interface show interface|find /I "已启用"|find /I "已连接"|find /I "专用"', {encoding: 'binary',
                timeout: 100000,
                maxBuffer: 200 * 1024}, function (err, stdout, stdin) {
                if (err)
                    console.log(err);
                stdout = iconv.decode(stdout, 'GBK');
                names = stdout.replace(/\n/g, '').split('            ');
                names = [names.pop().replace(/ /g, '')];
                callback(names);
            });
        }
    },
    saveMachineDns: function (content, netName, callback) {
        if (this.sys == 'Mac') {
            this.sysPassword = global.localStorage.sysPassword;
            if (!this.sysPassword) {
                this.sysPassword = window.prompt("请输入管理员密码", "");
                global.localStorage.sysPassword = this.sysPassword;
            }
            fs.writeFileSync(this.changeDnsSh, 'echo "' + this.sysPassword + '\\n" | sudo -S networksetup -setdnsservers ' + netName + ' ' + content);
            var last = exec('chmod 777 ' + this.changeDnsSh);
            last.on('exit', function (err) {
                if (!err)
                    exec(dns.changeDnsSh, function (err) {
                        if (!err){
                            callback('', 'DNS已覆盖，顺便刷新了下DNS！');
                        }else{
                            this.sysPassword = '';
                            global.localStorage.sysPassword = this.sysPassword;
                            callback('没有权限，请输入正确的密码！');
                        }
                    });
                else{
                    this.sysPassword = '';
                    global.localStorage.sysPassword = this.sysPassword;
                    callback('没有权限，请输入正确的密码！');
                }
            });
        } else if (dns.sys == 'Windows') {
            var cmd = 'netsh interface ip set dns name="'+ netName +'" source=static addr='+ content +' register=PRIMARY';
            if(content == '')
                cmd = 'netsh interface ip set dns name="'+ netName +'" source=dhcp register=PRIMARY';
            exec(cmd, function (e) {
                if (e)
                    callback('未知错误！！');
                else
                    callback('','DNS已更改，顺便帮你刷新了DNS！！');
            });
        }
    },
    getLocalDnsData: function () {
        return JSON.parse(global.localStorage.localDns);
    },
    saveLocalDnsData: function (localDns) {
        global.localStorage.localDns = JSON.stringify(localDns);
    }
};
module.exports = dns;