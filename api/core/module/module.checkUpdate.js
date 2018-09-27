
module.exports = function(){
    return gladys.utils.request({
        method: 'GET',
        url: 'https://developer.gladysproject.com/api/v1/modules'
    })
    .then(function(modulesOnStore){
        gladys.module.get()
        .then((modules)=>{
            modules.forEach(function(module) {
                modulesOnStore.forEach(moduleOnStore => {
                    if(moduleOnStore.name === module.name){
                        if(moduleOnStore.version > module.version) {
                            // we get all admins
                            return gladys.user.getAdmin()
                            .then(function(admins){
                                // foreach admin
                                admins.forEach(function(admin){
                                    
                                    // we create a new notification
                                    var notification = {
                                        title: sails.__({ phrase: 'notification-update-available-title', locale: admin.language.substr(0,2)}) + ` ${moduleOnStore.version}`,
                                        text: `${moduleOnStore.name} ` + sails.__({ phrase: 'notification-update-module-available-text', locale: admin.language.substr(0,2)}) + ` ${moduleOnStore.version}`,
                                        icon: 'fa fa-cloud-download',
                                        iconColor: '',
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
                });
            })
        })
    })
    
};