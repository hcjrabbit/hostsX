/**
 * Auhor: chengjun.hecj
 * Descript:
 */
var sys = global.sys;
var hostsPath = '',
    dnsPath = '',
    flushDnsCommod = '';
switch (sys) {
    case 'Windows':
        hostsPath = 'C:\\WINDOWS\\system32\\drivers\\etc\\hosts';
        flushDnsCommod = 'ipconfig /flushdns';
        break;
    case 'Mac' :
        dnsPath = '/private/var/run/resolv.conf';
        hostsPath = '/etc/hosts';
        flushDnsCommod = 'dscacheutil -flushcache';
        break;
    case 'Linux' :
        break;
    default  :
        break;
}

module.exports = {
    name : 'hostsX',
    version : 'v1.0.1',
    update : {
        hostname : 'appupdate.aws.af.cm'
    },
    winWidth: 900,
    winHeight: 530,
    flushDnsCommod: flushDnsCommod,
    hostsPath: hostsPath,
    dnsPath : dnsPath,
    historyMxNm: 10,
    tipDelay : 1000
}

