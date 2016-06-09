
var Promise = require('bluebird');
var regex = /(([0-1]{0,1}[0-9])|(2[0-3]))(:|h)[0-5]{0,1}[0-9]?/g;


module.exports = function(text){
    var res = text.match(regex);
    return Promise.resolve(res);
};