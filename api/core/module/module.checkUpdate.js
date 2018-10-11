
const semver = require('semver')
var Promise = require('bluebird');

module.exports = function(){
    return gladys.module.get()
    .then(function(modulesInstalled) {
        Promise.map(modulesInstalled, function(moduleInstalled) {
            return gladys.utils.request({
                method: 'GET',
                url: 'https://developer.gladysproject.com/api/v1/modules/'+moduleInstalled.slug
            })
            .then(function(moduleOnStore) {
                if(semver.valid(moduleOnStore.version) && semver.valid(moduleInstalled.version)){
                    if(semver.gt(moduleOnStore.version, moduleInstalled.version) === true) {
                        // we get all admins
                        return gladys.user.getAdmin()
                        .then(function(admins){
                            // foreach admin
                            Promise.map(admins, function(admin){
                                
                                // we create a new notification
                                var notification = {
                                    title: sails.__({ phrase: 'notification-update-available-title', locale: admin.language.substr(0,2)}) + ` ${moduleOnStore.version}`,
                                    text: `${moduleInstalled.name} ` + sails.__({ phrase: 'notification-update-module-available-text', locale: admin.language.substr(0,2)}) + ` ${moduleOnStore.version}`,
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
                }
            })
        },{concurrency:1})
    })    
};