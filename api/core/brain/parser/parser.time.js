const Promise = require('bluebird');
const chrono = require('chrono-node');

module.exports = function(originalText){

    var results = chrono.parse(originalText);
    text = originalText;

    for(var i = 0; i < results.length; i++){
        text = text.replace(results[i].text, '%TIME%');
    }
    
    return Promise.resolve({
        text,
        times: results
    });
};