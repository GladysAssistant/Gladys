  
(function () {
    'use strict';

    angular
        .module('gladys')
        .controller('ModuleCtrl', ModuleCtrl);

    ModuleCtrl.$inject = ['moduleService', '$scope', 'notificationService', 'storeService', '$sce', 'moment'];

    function ModuleCtrl(moduleService, $scope, notificationService, storeService, $sce, moment) {
        /* jshint validthis: true */
        var vm = this;
        
        vm.modules = [];
        vm.modulesFromStore = null;
        vm.installModule = installModule;
        vm.configModule = configModule;
        vm.uninstallModule = uninstallModule;
        vm.showModule = showModule;
        vm.getModulesStore = getModulesStore;
        vm.getReviews = getReviews;
        vm.getVersions = getVersions;
        vm.refreshModule = get;
        vm.upgradeModule = upgradeModule;
        vm.installationStep = 0;
        
        vm.modulesCurrentlyInstalled = {};
        
        activate();

        function activate() {
            get();
            waitForInstallationStep();
        }
        
       function get(){
           return moduleService.get()
             .then(function(data){
                data.data.forEach(function(module){
                    if(module.machine) {
                        module.lastSeenRelative = moment(module.lastSeen).fromNow();
                        module.active = (new Date().getTime() - new Date(module.lastSeen).getTime()) < 3*60*1000;
                    }
                });
                vm.modules = data.data;
             });
       }
       
       function getModulesStore(){
           return storeService.getModules()
             .then(function(data){
                 vm.modulesFromStore = data.data;
                 $scope.$apply();
             });
       }
       
       function installModule(module){
           vm.installing = true;

           module.slug = module.slug.toLowerCase();
           
           // url is the url of the module on the developper website
           // we want here the url of the git repository, stored in link
           if(module.link) module.url = module.link;
           return moduleService.install(module)
             .then(function(data){
                vm.modulesCurrentlyInstalled[module.slug] = module;
                storeService.saveDownload(module.idModule);
             })
             .catch(function(){
                 notificationService.errorNotificationTranslated('MODULE.INSTALLED_FAIL_NOTIFICATION', module.name);
             });
       }
       
       // return true if the module is already installed
       // return the ID of the module if true
       function isInstalled(slug){
           var found = false;
           var i = 0;
           while(!found && i < vm.modules.length){
               found = (vm.modules[i].slug === slug);
               i++;
           }
           var result = {found: found};
           if(found) result.localId = vm.modules[i-1].id;
           return result;
       }
       
       // show the module clicked
       function showModule(module){
           
           vm.selectedModule = module;
           
           // check if the module is already installed
           var result = isInstalled(vm.selectedModule.slug);
           vm.selectedModule.installed = result.found;
           
           // if the module is installed, we save his local ID 
           if(result) vm.selectedModule.localId = result.localId;
           
           // showing the modal
           $('#modalShowModule').modal('show');
           
           // getting infos
           storeService.getModuleInfos(module.slug)
                .then(function(data){
                    vm.selectedModule.instructions = $sce.trustAsHtml(data.data.instructionsHTML);
                    $scope.$apply();
                });
       }
       
       
       function getReviews(idModule){
           return storeService.getReviews(idModule)
             .then(function(data){
                vm.selectedModule.reviews = data.data; 
             });
       }
       
       function getVersions(idModule){
           return storeService.getVersions(idModule)
             .then(function(data){
                vm.selectedModule.versions = data.data; 
             });
       }
       
       function uninstallModule(index, id){
           vm.uninstalling = true;
           return moduleService.uninstall(id)
             .then(function(){
                 
                 // remove modules from module list
                 if(index) vm.modules.splice(index, 1);
                 else {
                     
                     // we were in the modal view
                     get();
                     vm.selectedModule.installed = false;
                     delete vm.selectedModule.localId;
                     vm.uninstalling = false;
                 }
             })
             .catch(function(){
                 vm.uninstalling = false;
             });
       }

       function upgradeModule(index, module){
        storeService.getModuleInfos(module.slug)
            .then(function(data) {
                if(data.data.version){
                    vm.modules.splice(index, 1);
                    notificationService.successNotificationTranslated('MODULE.CURRENTLY_UPGRADING_NOTIFICATION', module.name);
                    return moduleService.upgrade(module.id, data.data.version);
                }else{
                    $('#modalModuleVersion').modal('show')
                    $('#validateButton').click(function (e) {
                        var version = $('#inputModuleVersion').val()
                        if(version){
                            vm.modules.splice(index, 1);
                            notificationService.successNotificationTranslated('MODULE.CURRENTLY_UPGRADING_NOTIFICATION', module.name);
                            return moduleService.upgrade(module.id, version);
                        }else{
                            notificationService.errorNotificationTranslated('MODULE.EMPTY_VERSION_FAIL_NOTIFICATION');
                        }
                    })
                }
                
            })
            .catch(function(err){
                notificationService.errorNotificationTranslated('MODULE.FAIL_UPGRADING_NOTIFICATION', module.name);
                return Promise.reject(err);
            });
       }
       
       function waitForInstallationStep(){
            io.socket.on('moduleInstallationProgress', function (data) {
                 updateInstallationStep(data.step);
                 
                 // if module is installed with success,
                 // reset after 2 seconds
                 if(data.step == 4) {
                    
                    vm.modules.push(data.module);
                    vm.installing = false;
                    if(vm.modulesCurrentlyInstalled[data.module.slug]) {
                        vm.modulesCurrentlyInstalled[data.module.slug].installed = true;
                        vm.modulesCurrentlyInstalled[data.module.slug].localId = data.module.id;
                        delete vm.modulesCurrentlyInstalled[data.module.slug];
                    }
                    notificationService.successNotificationTranslated('MODULE.INSTALLED_SUCCESS_NOTIFICATION', data.module.name);
                    
                    vm.newModule = {};
                    
                    setTimeout(function(){
                        updateInstallationStep(0);
                    }, 2000);
                 }
            }); 
       }
       
       function updateInstallationStep(step){
           $scope.$apply(function(){
               vm.installationStep = step;
           });
       }
       
       function configModule(slug){
           return moduleService.config(slug)
             .then(function(){
                 notificationService.successNotificationTranslated('MODULE.CONFIG_SUCCESS_NOTIFICATION');
             })
             .catch(function(err){
                 notificationService.errorNotificationTranslated('MODULE.CONFIG_FAIL_NOTIFICATION', err.data);
             })
       }
       
    }
})();
