
var Promise = require('bluebird');
var regex = /(([0-1]{0,1}[0-9])|(2[0-3]))(:|h)[0-5]{0,1}[0-9]?/g;


module.exports = function(originalText){
    var res = originalText.match(regex);
    var text = originalText.replace(regex, '%TIME%');

    return Promise.resolve({
        text,
        times: res
    });
};