/**
 * Auhor: chengjun.hecj
 * Descript:
 */
module.exports = function (date, type) {
    var dateStr = '';
    var year = date.getFullYear(),
        month = isTwo(date.getMonth() + 1),
        day = isTwo(date.getDate()),
        hour = isTwo(date.getHours()),
        minute = isTwo(date.getMinutes()),
        seconds = isTwo(date.getSeconds());
    switch (type) {
        case 0 :
            dateStr = year.toString().substr(2) + '-' + month + '-' + day + ' ' + hour + ':' + minute;
            break;
        case 1 :
            dateStr = year + '-' + month + '-' + day + ' ' + hour + ':' + minute + ':' + seconds;
            break;
    }
    function isTwo(str){
        if(parseInt(str) < 10)
            str = '0' + str;
        return str;
    }
    return dateStr;
};