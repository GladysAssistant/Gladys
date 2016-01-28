module.exports = install;

var Promise = require('bluebird');
var createNotificationType = Promise.promisify(NotificationType.create);

/**
 * Install a new Notification Type
 */
function install (type){
    return createNotificationType(type);
}