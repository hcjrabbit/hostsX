/**
 * Auhor: chengjun.hecj
 * Descript:
 */
var fs = require('fs'),
    path = require('path'),
    exec = require('child_process').exec;



var hosts = {
    sys : global.sys,
    tmpHostsFile : path.join(path.join(fs.realpathSync('.')),'app/script/model','hosts'),
    changeHostsSh :path.join(path.join(fs.realpathSync('.')), 'app/script/control', 'changeHosts.sh'),
    config : global.config,
    hostsPath : global.config.hostsPath,
    get: function (callback) {
        var content = '';
        var hostsPath = hosts.hostsPath;

        if(fs.existsSync(hostsPath)){
            content = fs.readFileSync(hostsPath,'utf-8');
        }else{
            callback('找不到hosts文件，sorry！');
        }
        return content;
    },
    save: function (content,callback) {
        fs.stat(hosts.hostsPath, function (err) {
            if (err) {
                callback('出错啦，不知道什么原因！');
            } else {
                fs.writeFileSync(hosts.tmpHostsFile,content);


                if(hosts.sys == 'Mac'){

                    hosts.sysPassword = global.localStorage.sysPassword;
                    if (!hosts.sysPassword) {
                        hosts.sysPassword = window.prompt("请输入管理员密码", "");
                        global.localStorage.sysPassword = hosts.sysPassword;
                    }
                    fs.writeFileSync(hosts.changeHostsSh, 'echo "' + hosts.sysPassword + '\\n" | sudo -S mv -f '+ hosts.tmpHostsFile + ' ' + hosts.hostsPath);
                    var last = exec('chmod 777 ' + hosts.changeHostsSh);
                    last.on('exit', function (err) {
                        if (!err)
                            exec(hosts.changeHostsSh, function (err) {
                                if (!err){
                                    callback('', 'DNS已覆盖，顺便刷新了下DNS！');
                                }else{
                                    hosts.sysPassword = '';
                                    global.localStorage.sysPassword = hosts.sysPassword;
                                    callback('没有权限，请输入正确的密码！');
                                }
                            });
                        else{
                            hosts.sysPassword = '';
                            global.localStorage.sysPassword = hosts.sysPassword;
                            callback('没有权限，请输入正确的密码！');
                        }
                    });



                }else {
                    exec('move /y ' + hosts.tmpHostsFile + ' ' + hosts.hostsPath,function (e) {
                        if (e){
                            callback('没有权限，请更改hosts文件权限！');
                        }else{
                            callback('','hosts已覆盖，顺便帮你刷新了DNS！！');
                        }
                    });
                }
            }
        });
    }
};


module.exports = hosts;