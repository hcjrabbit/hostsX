/**
 * Auhor: chengjun.hecj
 * Descript:
 */

var fs  = require('fs');

var localHostsList = require('./localHostsList');

var localController = {
    getByName : function(){

    },
    save : function(){

    },
    del : function(){

    },
    rename : function(){

    },
    getList : function(){
        return localHostsList;
    }
};

module.exports = localController;
