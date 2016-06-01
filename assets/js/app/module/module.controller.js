/** 
  * Gladys Project
  * http://gladysproject.com
  * Software under licence Creative Commons 3.0 France 
  * http://creativecommons.org/licenses/by-nc-sa/3.0/fr/
  * You may not use this software for commercial purposes.
  * @author :: Pierre-Gilles Leymarie
  */
  
(function () {
    'use strict';

    angular
        .module('gladys')
        .controller('ModuleCtrl', ModuleCtrl);

    ModuleCtrl.$inject = ['moduleService', '$scope', 'notificationService'];

    function ModuleCtrl(moduleService, $scope, notificationService) {
        /* jshint validthis: true */
        var vm = this;
        
        vm.modules = [];
        vm.installModule = installModule;
        vm.configModule = configModule;
        vm.uninstallModule = uninstallModule;
        vm.installationStep = 0;
        
        activate();

        function activate() {
            get();
            waitForInstallationStep();
        }
        
       function get(){
           return moduleService.get()
             .then(function(data){
                vm.modules = data.data; 
             });
       }
       
       function installModule(module){
           return moduleService.install(module)
             .then(function(data){
                 vm.modules.push(data.data);
                 notificationService.successNotificationTranslated('MODULE.INSTALLED_SUCCESS_NOTIFICATION', module.name);
             })
             .catch(function(){
                 notificationService.errorNotificationTranslated('MODULE.INSTALLED_FAIL_NOTIFICATION', module.name);
             });
       }
       
       function uninstallModule(index, id){
           return moduleService.uninstall(id)
             .then(function(){
                 vm.modules.splice(index, 1);
             });
       }
       
       function waitForInstallationStep(){
            io.socket.on('moduleInstallationProgress', function (data) {
                 updateInstallationStep(data.step);
                 
                 // if module is installed with success,
                 // reset after 2 seconds
                 if(data.step == 4){
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
