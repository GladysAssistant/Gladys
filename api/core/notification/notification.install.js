module.exports = install;

const queries = require('./notification.queries.js');

/**
 * @public
 * @description This function create an notificationType
 * @name gladys.notification.install
 * @param {Object} type 
 * @param {String} type.service The service of notification
 * @param {String} type.name The name of notification
 * @example
 * var type = {
 *     service: 'pushbullet',
 *     name: 'PushBullet'
 * };
 * 
 * gladys.notification.install(notificationType)
 *       .then(function(type){
 *           // new type created !
 *       })
 *       .catch(function(err){
 *          // something bad happened :/ 
 *       });
 */
function install(type) {

    // test if exist
    return gladys.utils.sql(queries.getNotificationTypeByService, [type.service])
        .then((notificationTypes) => {
            
            // if yes, update
            if(notificationTypes.length > 0) return NotificationType.update({service: type.service}, type);

            // if no, create
            return NotificationType.create(type);
        });
}