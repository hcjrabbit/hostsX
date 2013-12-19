/**
 * Auhor: chengjun.hecj
 * Descript:
 */

var Menus = {};


Menus.localLiMenu = new global.gui.Menu();

Menus.localLiMenu.init = function(handles){
    Menus.localLiMenu.append(new gui.MenuItem({
        label: '重命名',
        click: handles[0]
    }));
    Menus.localLiMenu.append(new gui.MenuItem({
        label: '删除',
        click: handles[1]
    }));
    Menus.localLiMenu.append(new gui.MenuItem({ type: 'separator' }));
    Menus.localLiMenu.append(new gui.MenuItem({
        label: '查看历史修改记录',
        click: handles[2]
    }));

};


module.exports = Menus;