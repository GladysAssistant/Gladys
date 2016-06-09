var queries = require('./notification.queries.js');

module.exports = function(notification){
  
  // we check first if the notification already exist
  return gladys.utils.sql(queries.checkIfExist, [notification.user, notification.title, notification.text])
    .then(function(notifications){
       if(notifications.length === 0){
           return gladys.notification.create(notification);
       } else {
           return Promise.resolve();
       }
    });
};