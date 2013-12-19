/**
 * Auhor: chengjun.hecj
 * Descript:
 */
var path = require('path'),
    fs = require('fs');
var rootPath = path.join(fs.realpathSync('.'));

var tray = {
    init: function (hostsData,dnsData) {
        this.gui = global.gui;
        this.win = global.win;
        this.X = global.X;
        this.tray = new this.gui.Tray({ title: 'hostsX', icon: '../assets/img/hostsX.png' });
        this.render(hostsData,dnsData);
        return tray;
    },
    render: function (hostsData, dnsData) {
        if(!tray.gui)
            return;
        tray.menu = new tray.gui.Menu();

        var icon1 = path.join(rootPath, 'app/assets/img', 'tray_s.png'),
            icon2 = path.join(rootPath, 'app/assets/img', 'tray_k.png');
        hostsData.list.forEach(function (item,i) {
            tray.menu.append(new tray.gui.MenuItem({
                label: item.name,
                click: function () {
                    tray.X.coverHosts(item.history[0].content,i);
                },
                icon: (i == hostsData.currentIndex ? icon1 : icon2)
            }));
        });
        tray.menu.append(new tray.gui.MenuItem({ type: 'separator' }));
        dnsData.history.forEach(function (item, i) {
            tray.menu.append(new tray.gui.MenuItem({
                label: item,
                click: function () {
                    tray.X.dnsHistoryListChange(i);
                },
                icon: (i == dnsData.currentIndex ? icon1 : icon2)
            }));
        });
        tray.menu.append(new tray.gui.MenuItem({
            label: '显示主程序',
            icon : icon2,
            click: function () {
                tray.win.show();
            }}));
        tray.tray.menu = tray.menu;
    }
};
module.exports = tray;