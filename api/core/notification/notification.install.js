module.exports = install;

const queries = require('./notification.queries.js');

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