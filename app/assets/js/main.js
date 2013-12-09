/**
 * Auhor: chengjun.hecj
 * Descript:
 */
var path = require('path'),
    fs  = require('fs');

var localListsController = require('./model/localListsControl'),
    hostsController = require('./controls/hostsController');



if(localListsController.getList().length == 0){
    console.log(hostsController.get());
}
