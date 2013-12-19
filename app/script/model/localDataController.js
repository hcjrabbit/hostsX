/**
 * Auhor: chengjun.hecj
 * Descript:
 */

var localController = {
    getLocalData : function(){
        return JSON.parse(global.localStorage.localData);
    },
    rewrite : function(data,callback){
        //重置左边列表的数据渲染
        callback(data);
        global.localStorage.localData = JSON.stringify(data);
    }
};

module.exports = localController;
