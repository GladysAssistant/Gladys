var Promise = require('bluebird');

module.exports = function(){
  return gladys.update.getLastVersion()
    .then(function(version){
       if(version.name > gladys.version){
           sails.log.info(`New version of Gladys available : ${version.name}`);
           return notificationAdmin(version.name);
       } else {
           sails.log.info('Gladys is up to date !');
           return Promise.resolve();
       }
    });  
};


function notificationAdmin(version){
    
    // we get all admins
    return gladys.user.getAdmin()
      .then(function(admins){
          
         // foreach admin
         return Promise.map(admins, function(admin){
             
             // we create a new notification
             var notification = {
                title: sails.__({ phrase: 'notification-update-available-title', locale: admin.language.substr(0,2)}) + ` ${version}`,
                text: sails.__({ phrase: 'notification-update-available-text', locale: admin.language.substr(0,2)}) + ` ${version}`,
                icon: sails.config.update.icon,
                iconColor: sails.config.update.iconColor,
                link: sails.config.update.link,
                priority: 0,
                user: admin.id,
             };
             
             // and send it only if we hadn't done it before
             return gladys.notification.createIfNotExist(notification);
         });
      });
}