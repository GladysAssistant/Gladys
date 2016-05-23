module.exports = create;

var Promise = require('bluebird');
var queries = require('./notification.queries.js');

function create(notification) {
    return Notification.create(notification)
        .then(function(notification) {
            return [notification, gladys.utils.sql(queries.getNotificationTypes, [notification.user])];
        })
        .spread(function(notification, types) {
            
            sails.log.info(`Notification : create : Notification saved with success. Trying to send notification to user ID ${notification.user}`);
            
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

    if (!gladys.modules[type.service] || typeof gladys.modules[type.service].notify !== "function") {
        return Promise.reject(new Error(`${type.service} is not a valid service`));
    }
    
    sails.log.info(`Notification : create : Trying to contact ${type.service}`);

    return gladys.modules[type.service].notify(notification)
        .then(function(ok) {
            
            // if true is returned, we stop the promise chain
            // it means one notification worked! 
            if (ok === true) {
                return Promise.reject(new Error('ok'));
            }
        });
}
