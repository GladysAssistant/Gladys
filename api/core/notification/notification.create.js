module.exports = create;

var Promise = require('bluebird');
var queries = require('./notification.queries.js');

function create(notification) {
    return Notification.create(notification)
        .then(function(notification) {
            return [notification, gladys.utils.sql(queries.getNotificationTypes, [notification.user])];
        })
        .spread(function(notification, types) {
            return Promise.mapSeries(types, function(type) {
                return startService(notification, type);
            });
        })
        .catch(function(err) {
            if (err.message !== 'ok') {
                sails.log.error(err);
            }
        });
}

/**
 * Call the service related to the notification
 */
function startService(notification, type) {

    if (!global[type.service] || typeof global[type.service].exec !== "function") {
        return Promise.reject(new Error(`${type.service} is not a valid service`));
    }

    return global[type.service].exec(notification)
        .then(function(ok) {
            // if true is returned, we stop the promise chain
            // it means one notification worked! 
            if (ok === true) {
                return Promise.reject(new Error('ok'));
            }
        });
}
