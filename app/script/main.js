/**
 * Auhor: chengjun.hecj
 * Descript:
 */


var exec = require('child_process').exec,
    fs = require('fs');

global.gui = gui = require('nw.gui');
global.win = win = gui.Window.get();
global.navigator = navigator;
global.sys = sys = require('./script/control/sysVision');
global.config = config = require('./script/config');
global.localStorage = localStorage;

var tray = require('./script/control/tray'),
    Menus = require('./script/control/menu'),
    dnsController = require('./script/model/dnsController'),
    hostsController = require('./script/model/hostsController'),
    localDataController = require('./script/model/localDataController'),
    formatDate = require('./script/control/formatDate');


var update = require('./script/control/update');





var $ = jQuery,
    $localListsPanel = $('#localListsPanel'),
    $editPanel = $('#editPanel'),
    $fileStat = $('#fileStat'),
    $extend = $('#extend'),
    $dataDetail = $('#dataDetail'),
    $setDnsPanel = $('#setDnsPanel'),
    localData,
    localDns ;


win.setMinimumSize(config.winWidth, config.winHeight);

var X = {
    jQuery: $,
    win: win,
    //当前被右键点击的LI索引
    //currentLocalLiPopIndex:'',
    /**
     * 初始化主界面
     */
    init: function () {
        var self = this;
        $(document).tooltip({
            track: true
        });
        $('#winTip').tooltip();

        //第一次打开软件无数据
        if (!localStorage.localData) {
            localData = {
                currentIndex  : -1,
                list : []
            };
            localDns = {
                currentIndex  : -1,
                selectNetnameIndex : -1,
                netNames : [],
                history : []
            };
            localStorage.sysPassword = '';
            dnsController.saveLocalDnsData(localDns);
            self.addData(null, hostsController.get(X.showTip), '本地', 'local');
        } else {
            localData = localDataController.getLocalData();
            localDns = dnsController.getLocalDnsData();
            //每次打开都取本地的Hosts
            self.resetHosts();
        }
        //本地数据置顶
        self.setTheLocalTop();
        //本地数据列表渲染
        self.localListsRender(localData.list);
        //取第一个history最早的记录
        $editPanel.val(localData.list[localData.currentIndex].history[0].content);

        //初始化各个右键菜单
        self.menuInit();
        //DOM元素事件绑定总入口
        self.bindEvent();
        tray.init(localData, localDns);


        if (localDns.netNames.length == 0) {
            //获取netName值
            dnsController.getMachineNetName(function (netNames) {
                if (sys == 'Windows')
                    localDns.selectNetnameIndex = 0;
                localDns.netNames = netNames;
                dnsController.saveLocalDnsData(localDns);
            });
        }
    },
    /**
     * 界面事件绑定入口
     */
    bindEvent: function () {
        var self = this;

        //窗口尺寸变化监听函数
        win.on('resize', function (width, height) {
            //当窗口变化尺寸时，改变编辑板的高度
            $editPanel.css('height', height - 200);
        });
        //关闭窗口
        $('#closeWin').on('click', function () {
            win.close();
        });
        //最小化窗口
        $('#minimizeWin').on('click', function () {
            win.minimize();
        });
        $('#help').on('click', self.openHelp);
        //全局点击
        $('body').on({
            'click': self.bodyClick,
            'keydown': self.ctrlS
        });
        //保存按钮
        $('#save').on('click', self.modifyData);
        //覆盖按钮
        $('#cover').on('click', function () {
            self.coverHosts();
        });
        //增加本地数据
        $('#newFile').on('click', self.addData);
        //刷新DNS
        $('#refreshDNS').on('click', self.flushDNS);
        //删除本地数据
        $('#delFile').on('click', self.delData);
        //团队功能
        $('#teamServer').on('click', function () {
            self.showTip('我在发粪涂墙ing....！');
        });
        //上网方式选择
        $('#netNameSelect').on('change', self.setNetNmaeSelectedFirst);
        //清空历史版本
        $('#cleanHistory').on('click', self.cleanHistory);
        //清空Hosts
        $('#cleanHosts').on('click', self.cleanHosts);
        //清空DNS
        $('#cleanDns').on('click', self.cleanDns);
        $localListsPanel.find('li').on('contextmenu', self.localLiMenuHandle);
        //搜索功能
        $('#searchBtn').on('click', self.searchHosts);
        //设置DNS
        $('#setDNS').on('click', self.showSetDnsPanel);
        //保存DNS
        $('#dnsSave').on('click', self.beforeDnsSave);
        //搜索框回车事件
        $('#searchInput').on('keydown', function (e) {
            if (e.keyCode == 13)
                self.searchHosts();
        });
        //历史记录选择
        $('#dataHistoryList').on('change', self.historyListChange);
        //dns历史记录选择
        $('#dnsHistorySelect').on('change', self.dnsHistoryListChange);
        //清空DNS历史记录
        $('#cleanDnsHistory').on('click', self.cleanDnsHistory);
        //编辑窗口监听
        $editPanel.on('keydown', self.editerListen);
    },
    /**
     * 每次上网方式改变就讲该值放于首位以便下次不用再选择
     */
    setNetNmaeSelectedFirst: function () {
        localDns.selectNetnameIndex = $(this).val();
        dnsController.saveLocalDnsData(localDns);
    },
    showSetDnsPanel: function (e) {
        if ($extend.hasClass('show') && $setDnsPanel.hasClass('show')) {
            $extend.removeClass('show');
            return;
        }
        X.showDnsPanel();

        if ($extend.hasClass('show') && !$setDnsPanel.hasClass('show')) {
            $extend.find('.inner').removeClass('show');
            $setDnsPanel.addClass('show');
        } else {
            $extend.find('.inner').removeClass('show');
            $setDnsPanel.addClass('show');
            $extend.addClass('show');
        }
        e.stopPropagation();
    },
    showDnsPanel: function () {
        dnsController.getMachineDns(function (msg, content) {
            if (msg) {
                X.showTip(msg);
                return;
            }

            X.restDnsPanel(content);
        });

    },
    restDnsPanel: function (currentDns) {
        if (!currentDns) {
            $('#dnsInput').val('');
            localDns.currentIndex = -1;
        }
        $('#dnsInput').attr('placeholder', currentDns);
        $('#dnsHistorySelect').html(new EJS({url: ('assets/view/dnsHistoryOptions.ejs')}).render({localDns: localDns}));
        $('#netNameSelect').html(new EJS({url: ('assets/view/netNameOptions.ejs')}).render({localDns: localDns}));
        tray.render(localData, localDns);
    },
    dnsHistoryListChange: function (index) {
        var value = isNaN(index) ? $(this).val() : index;

        $('#dnsInput').val(localDns.history[value]);

        localDns.currentIndex = value;
        dnsController.saveLocalDnsData(localDns);
        tray.render(localData, localDns);
    },
    cleanDns: function () {
        X.restDnsPanel('');
        X.saveDns('');
    },
    beforeDnsSave: function () {
        var isSave = $('#isSaveDnsToHistory')[0].checked,
            value = $('#dnsInput').val();
        if (isSave && !X.inArray(value, localDns.history) && $.trim(value) != '') {
            localDns.history.unshift(value);
            dnsController.saveLocalDnsData(localDns);
        }
        X.restDnsPanel(value);
        X.saveDns(value);
    },
    inArray: function (item, arr) {
        var inArr = false;
        arr.forEach(function (v) {
            if (v == item)
                inArr = true;
        });
        return inArr;
    },
    saveDns: function (value) {
        var netName = $('#netNameSelect').val();
        if (netName < 0) {
            X.showTip('请选择上网方式！');
            return;
        }
        if (sys == 'Mac') {
            dnsController.saveMachineDns(value || 'empty', localDns.netNames[netName], function (err, msg) {
                if (err) {
                    X.showTip(err);
                } else {
                    X.showTip(msg);
                    tray.render(localData, localDns);
                    X.flushDNS();
                }
            });
        } else
            dnsController.saveMachineDns(value, localDns.netNames[netName], function (msg) {
                if (msg)
                    X.showTip('没有权限！');
                else
                    X.flushDNS();

            });
    },
    cleanDnsHistory: function () {
        localDns.history = [];
        X.restDnsPanel($('#dnsInput').val());
        dnsController.saveLocalDnsData(localDns);
        X.showTip('历史记录已清空！');
    },
    cleanHistory: function () {
        var item = localData.list[localData.currentIndex];
        item.history = [item.history[0]];
        X.showTip('历史记录已清空！');
        X.resetDetail(localData.list[localData.currentIndex]);
    },
    cleanHosts: function () {
        $localListsPanel.find('li:eq(0)').click();
        $editPanel.val('');
        $('#save').click();
        $('#cover').click();
    },
    ctrlS: function (e) {
        if ((event.ctrlKey || event.metaKey) && e.keyCode == 83)
            $('#save').click();
    },
    bodyClick: function (e) {
        var $target = $(e.target);
        if ($target.closest('#editPanel').length === 0 && $target.closest('#extend').length === 0 && !$target.hasClass('arrow')) {
            $extend.find('inner').removeClass('show');
            $extend.removeClass('show');
        }
    },
    menuInit: function () {
        Menus.localLiMenu.init([function () {
            X.renameDataName(window.prompt("请输入名称", ""));
        }, function () {
            X.delData(null, X.currentLocalLiPopIndex);
        }, function () {
            X.viewDataDetail(X.currentLocalLiPopIndex);
        }]);
    },
    historyListChange: function () {
        var value = $(this).val(),
            item = localData.list[localData.currentIndex],
            content = item.history[value].content;

        item.modifyNoSave = content;
        $editPanel.val(content);
        $fileStat.html('提示：文件未保存！');
    },
    localLiMenuHandle: function (e) {
        var menu = Menus.localLiMenu;
        X.currentLocalLiPopIndex = $(e.target).attr('data-index');
        if (X.currentLocalLiPopIndex == 0) {
            menu.items[0].enabled = false;  //本地文件不能修改名称和删除
            menu.items[1].enabled = false;
        } else {
            menu.items[0].enabled = true;  //本地文件不能修改名称和删除
            menu.items[1].enabled = true;
        }
        menu.popup(e.clientX, e.clientY);
    },
    resetHosts: function () {
        localData.list[0].history[0].content = hostsController.get(X.showTip);
    },
    viewDataDetail: function (index) {
        $localListsPanel.find('li:eq(' + index + ')').click();
        X.resetDetail(localData.list[localData.currentIndex]);

        if ($extend.hasClass('show') && !$dataDetail.hasClass('show')) {
            $extend.find('.inner').removeClass('show');
            $dataDetail.addClass('show');
        } else {
            $extend.find('.inner').removeClass('show');
            $dataDetail.addClass('show');
            $extend.addClass('show');
        }
    },
    resetDetail: function (item) {
        $('#dataName').html(item.name);
        $('#modifyDate').html(formatDate(new Date(item.history[0].date), 1));
        $('#dataHistoryList').html(new EJS({url: ('assets/view/historyOptions.ejs')}).render({item: item}));
    },
    setTheLocalTop: function () {
        //将本地的那条数据置顶并选中
        if (localData.list[0].id != 'local') {
            localData.currentIndex = 0;

            var tmpIndex = 0;
            localData.list.forEach(function (item, i) {
                if (item.id == 'local')
                    tmpIndex = i;
            });
            var tmpItem = localData.list.splice(tmpIndex, 1)[0];
            localData.list.unshift(tmpItem);
        }
    },
    localListsRender: function (data) {
        $localListsPanel.find('li').unbind();
        $localListsPanel.find('.arrow').unbind();
        $localListsPanel.html(new EJS({url: ('assets/view/localDataItem.ejs')}).render(data));
        $localListsPanel.find('li').bind({
            'click': X.showActiveContent,
            'contextmenu': X.localLiMenuHandle
        });
        $localListsPanel.find('.arrow').bind('click', function () {
            if ($extend.hasClass('show') && $dataDetail.hasClass('show')) {
                $extend.removeClass('show');
                return;
            }
            //当箭头被点击时，此时的索引一定是当前LI，因为只有当前LI才有箭头
            X.viewDataDetail(localData.currentIndex);

        });
    },
    openHelp: function () {
        $("#helpDialog").find('button').button();
        $('#checkUpdate').click(function () {
            localStorage.isUpdateLater = 0;
            update.init(X.updateDialogInit);
            $("#helpDialog").dialog('close');
        });
        $("#helpDialog").dialog();

    },
    showActiveContent: function () {
        $('.ui-tooltip').remove();
        $localListsPanel.find('li').removeClass('active');

        var currentIndex = $(this).addClass('active').attr('data-index');

        if (currentIndex == 0) {
            X.resetHosts();
        }

        //给上一次没有保存的建立缓存文件
        var content = $editPanel.val();
        var item = localData.list[localData.currentIndex];
        if (content != item.history[0].content)
            item.modifyNoSave =  content;
        //

        localData.currentIndex = currentIndex;

        item = localData.list[currentIndex];
        //判断该文件有没有未保存的信息，如有就显示，没有则显示最后一次保存
        $editPanel.val(item.modifyNoSave ? item.modifyNoSave : item.history[0].content);
        if(item.modifyNoSave)
            $fileStat.html('提示：文件未保存！');
        else
            $fileStat.html('');

        localDataController.rewrite(localData, X.localListsRender);
        tray.render(localData, localDns);
    },
    editerListen: function (e) {
        var content = $editPanel.val();
        if (event.ctrlKey || event.metaKey) {
            var mStart = $editPanel[0].selectionStart,
                mEnd = $editPanel[0].selectionEnd;
            if (e.keyCode == 191) {
                //为了能用CTRL + Z返回，顾做了一个上一步的历史
                X.ctrlZPre = content;
                //这里相当复杂，原理:第一步 将文字拆分为一个行的数组，第二步 计算哪些行在选取或者鼠标在哪一行
                //第三步 判断是否有#，如果有则取掉第一个，如果无则加一个# 第四步 重新设置鼠标开始结束位置
                var lines = content.split('\n'),
                    inMouseAreaLine = [];

                var mouseMove = 0;

                var total = -1;
                var s = 0, end = 0;
                //行数组循环检查
                lines.forEach(function (item, i) {
                    s = total + 1;
                    end = s + item.length;
                    //这里将所有的行在鼠标选取的情况计算在内
                    if (s == mStart || end == mEnd || s > mStart && end < mEnd || s < mStart && end < mEnd && mStart < end || s < mStart && end > mStart && end > mEnd || s > mStart && end > mEnd && mEnd > s)
                        inMouseAreaLine.push(i);
                    total = end;
                });
                inMouseAreaLine.forEach(function (item) {
                    if (lines[item][0] == '#') {
                        lines[item] = lines[item].substring(1, lines[item].length);
                        mouseMove--;
                    } else {
                        lines[item] = '#' + lines[item];
                        mouseMove++;
                    }

                });
                $editPanel[0].value = lines.join('\n');
                //因为textarea重写的原因，导致鼠标的坐标跑位，顾要重新设定
                $editPanel[0].selectionStart = mStart + mouseMove;
                $editPanel[0].selectionEnd = mEnd + mouseMove;
            }
            if (e.keyCode == 90 && X.ctrlZPre) {  //是否有历史记录
                $editPanel[0].value = X.ctrlZPre;
                //因为textarea重写的原因，导致鼠标的坐标跑位，顾要重新设定
                $editPanel[0].selectionStart = mStart;
                $editPanel[0].selectionEnd = mEnd;
                X.ctrlZPre = '';
            }
        }

        $fileStat.html('提示：文件未保存！');
    },

    /**
     * 增加本地数据接口
     * @param content
     * @param name
     * @param id
     */
    addData: function (e, content, name, id) {
        var nowDate = new Date();

        id = id || Date.parse(nowDate);
        name = name || formatDate(nowDate, 0);

        var tmpData = {
            id: id,
            name: name,
            history: [
                {
                    date: Date.parse(nowDate),
                    name: formatDate(nowDate, 1),
                    content: '',
                    modifyNoSave : ''
                }
            ]
        };


        localData.list.push(tmpData);
        X.setTheLocalTop();
        //当超过两条数据时，将第二条数据选中
        localData.currentIndex = localData.list.length -1 ;
        localDataController.rewrite(localData, X.localListsRender);   //同步本地数据文件
        $localListsPanel.find('li:eq('+ localData.currentIndex +')').click();

        tray.render(localData, localDns);
    },
    /**
     * 覆盖hosts函数
     */
    coverHosts: function (currentIndex) {
        if (currentIndex)
            localData.currentIndex = currentIndex;
        hostsController.save($editPanel[0].value, function (err,msg) {
            if (err) {
                X.showTip(err);
                return;
            }
            X.showTip(msg);
            X.flushDNS();
        });
        tray.render(localData, localDns);
    },
    /**
     * 保存按钮
     * 添加修改版本
     */
    modifyData: function () {
        var currentIndex = $localListsPanel.find('.active').attr('data-index'),
            content = $editPanel[0].value;

        var modifyItem = localData.list[currentIndex];

        $fileStat.html('');

        if (content == modifyItem.history[0].content) {
            return;
        }

        if (modifyItem.history.length == config.historyMxNm)
            modifyItem.history.pop();        //当修改历史版本记录达到指定上线时，删除最早的记录


        var tempData = {
            date: Date.parse(new Date()),
            name: formatDate(new Date(), 1),
            content: content
        };
        modifyItem.history.unshift(tempData);
        //将临时保存信息清空
        modifyItem.modifyNoSave = '';
        localDataController.rewrite( localData, X.localListsRender);   //同步本地数据文件
        tray.render(localData, localDns);

    },
    renameDataName: function (name) {
        localData.list[X.currentLocalLiPopIndex].name = name;
        localDataController.rewrite(localData, X.localListsRender);   //同步本地数据文件
        tray.render(localData, localDns);
    },
    delData: function (e, index) {
        var currentIndex = isNaN(index) ? $localListsPanel.find('li.active').attr('data-index') : index;
        if (currentIndex == 0) {
            X.showTip('本地hosts不能删除！');
            return;
        }
        localData.list.splice(currentIndex, 1);
        localData.currentIndex = 0;
        localDataController.rewrite(localData, X.localListsRender);   //同步本地数据文件
        tray.render(localData, localDns);

        $localListsPanel.find('li:eq(0)').click();   //第一个选中
    },
    flushDNS: function (e) {
        var last = exec(config.flushDnsCommod);
        last.on('exit', function () {
            if (e)
                X.showTip('DNS已刷新，去看看浏览器吧！！');
            else
                X.showTip('hosts已覆盖，顺便帮你刷新了DNS！！');
        });
    },
    searchHosts: function () {
        var tmpIndex;
        localData.list.forEach(function (item, i) {
            if (item.name == $.trim($('#searchInput').val()))
                tmpIndex = i;
        });
        if (isNaN(tmpIndex))
            X.showTip('抱歉！未找到匹配的文件！！');
        else
            $localListsPanel.find('li:eq(' + tmpIndex + ')').click();
    },
    showTip: function (msg) {
        $('#winTip').attr('title', msg).trigger('mouseenter');
        setTimeout(function () {
            $('#winTip').trigger('mouseout');
        }, config.tipDelay);
    },
    update: function (data) {


        $("#updateProcess").dialog();
        update.getZip(data.currentLink, function (value, total) {
            var per = (parseInt(value) / parseInt(total)).toFixed(2) * 100;
            $("#updateProcessBar").progressbar({
                value: per
            });
            if (per == 100) {
                $("#updateProcess").dialog("close");
                win.reload();
            }

        });
    },
    updateDialogInit: function (data) {
        if(localStorage.isUpdateLater == '0'){
            var $dialog = $('#updateDialog');
            $dialog.dialog();
            $dialog.find('button').button();
            $('#updateBtn').click(function(){
                $dialog.dialog('close');
                X.update(data);
            });
            $('#updateLaterBtn').click(function () {
                localStorage.isUpdateLater = 1;
                $dialog.dialog('close');
            });
            $('#updateCancelBtn').click(function () {
                $dialog.dialog('close');
            });
        }
    }
};

X.init();
update.init(X.updateDialogInit);
gui.Window.get().show();
