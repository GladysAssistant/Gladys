module.exports = install;

/**
 * Install a new Notification Type
 */
function install (type){
    return new Promise(function(resolve, reject){
       NotificationType.create(type, function(err, notificationType) {
           if(err) return reject(err);
           
           resolve(notificationType);
       }); 
    });
}