var request = require('request');
var Promise = require('bluebird');

module.exports = function() {
    return gladys.utils.request(sails.config.event.url)
        .then(function(events) {
            return Promise.map(events, gladys.eventType.create);
        });
};
