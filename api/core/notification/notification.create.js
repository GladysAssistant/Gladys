module.exports = create;

var Promise = require('bluebird');
var queries = require('./notification.queries.js');

/**
 * @public
 * @description This function create an notification
 * @name gladys.notification.create
 * @param {Object} options
 * @param {String} options.title The title of the notification
 * @param {String} options.text The text of the notification
 * @param {String} options.link The link of view
 * @param {String} options.icon The icon of the notification
 * @param {String} options.iconColor The icon color of the notification icon
 * @param {User} options.user The id of the user of the notification
 * @returns {Notification} notification
 * @example
 * var options = {
 *      title: "Update available !",
 *      text: "Gladys Update 3.8.0 is available",
 *      link: "/dashboard"
 *      icon: "fa fa-refresh",
 *      iconColor: "bg-light-blue",
 *      user: 1
 * }
 * 
 * gladys.notification.create(options)
 *      .then(function(notification){
 *          // notification created
 *      })
 *      .catch(function(err){
 *          // something bad happened ! :/
 *      });
 */

function create(options) {

    // handle scenarios
    var notification;
    if(options && options.params) notification = options.params;
    else notification = options;

    return Notification.create(notification)
        .then(function(notification) {
            return [notification, 
                    gladys.utils.sql(queries.getNotificationTypes, [notification.user]), 
                    gladys.user.getById({id: notification.user})
            ];
        })
        .spread(function(notification, types, user) {
            
            sails.log.info(`Notification : create : Notification saved with success. Trying to send notification to user ID ${notification.user}`);
            
            return Promise.mapSeries(types, function(type) {
                return startService(notification, type, user);
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
function startService(notification, type, user) {

    var notify = null;

    if(type.machine && type.machine.length) {
        sails.log.debug(`Notification module is not located on this machine, sending message on machine ${type.machine}`);
        gladys.emit('notification-notify', {notification, user, machine_id: type.machine, module_slug: type.service});
        return Promise.reject(new Error('ok'));
    } else if(gladys[type.service] && typeof gladys[type.service].notify === "function"){
        notify = gladys[type.service].notify;
    } else if (gladys.modules[type.service] || typeof gladys.modules[type.service].notify === "function") {
        notify = gladys.modules[type.service].notify;
    } else {
        return Promise.reject(new Error(`${type.service} is not a valid service`));
    }
    
    sails.log.info(`Notification : create : Trying to contact ${type.service}`);

    return notify(notification, user)
        .then(function(result) {
            
            sails.log.info(`Notification threw ${type.service} sent with success. Aborting the chain.`);
            
            // if module resolved, we stop the promise chain
            // it means one notification worked! 
            return Promise.reject(new Error('ok'));
        })
        .catch(function(e){
           
           // if the error is because we want to exist the promise chain,
           // we need to propagate the error
           if(e.message === 'ok') return Promise.reject(e);
           
           // if notification does not work, we resolve
           // it means that we need to continue the flow
           return Promise.resolve(); 
        });
}
