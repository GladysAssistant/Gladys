module.exports = create;

var Promise = require('bluebird');
var queries = require('./notification.queries.js');
var createNotification = Promise.promisify(Notification.create);
var getNotificationTypes = Promise.promisify(NotificationType.query);

function create (notification){    
   return createNotification(notification)
            .then(function(notification){
                return [notification, getNotificationTypes(queries.getNotificationTypes, [notification.user])];
            })
            .spread(function(notification, types){
                return Promise.each(types, startService.bind(null, notification));
            })
            .catch(function(err){
                 if(err.message !== 'ok'){
                     sails.log.err(err);
                 }
            });
}

/**
 * Call the service related to the notification
 */
function startService (notification, type){
        
    if(!global[type.service] || typeof global[type.service].exec !== "function"){
        return Promise.reject(new Error(`${type.service} is not a valid service`));
    }
    return global[type.service].exec(notification)
               .then(function(ok){
                   // if true is returned, we stop the promise chain
                   // it means one notification worked! 
                   if(ok === true){
                       throw new Error('ok');
                   }
               });
}