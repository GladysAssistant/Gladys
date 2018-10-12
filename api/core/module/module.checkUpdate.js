const semver = require('semver');
const Promise = require('bluebird');

module.exports = function checkUpdate() {
  
  // get the list of modules installed
  return gladys.module.get()
    .then((modulesInstalled) => {
      return Promise.map(modulesInstalled, (moduleInstalled) => {
            
        return gladys.utils.request({
          method: 'GET',
          url: sails.config.update.getModuleBySlugUrl + moduleInstalled.slug
        })
          .then((moduleOnStore) => {
            if (semver.valid(moduleOnStore.version) && semver.valid(moduleInstalled.version)) {
              if (semver.gt(moduleOnStore.version, moduleInstalled.version) === true) {
                return sendNotificationAdmins(moduleOnStore, moduleInstalled);
              }
            }
          });
      }, { concurrency: 1 });
    });
};

function sendNotificationAdmins(moduleOnStore, moduleInstalled) {
  return gladys.user.getAdmin()
    .then((admins) => {
      return Promise.map(admins, (admin) => {
        
        // we create a new notification
        var notification = {
          title: sails.__({ 
            phrase: 'notification-update-available-title',
            locale: admin.language.substr(0, 2)
          }) + ` ${moduleOnStore.version}`,
          text: `${moduleInstalled.name} ` + sails.__({
            phrase: 'notification-update-module-available-text',
            locale: admin.language.substr(0, 2)
          }) + ` ${moduleOnStore.version}`,
          icon: 'fa fa-cloud-download',
          iconColor: 'blue',
          link: '/dashboard/module',
          priority: 0,
          user: admin.id,
        };

        // and send it only if we hadn't done it before
        return gladys.notification.createIfNotExist(notification);
      });
    });
}