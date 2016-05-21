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

    ModuleCtrl.$inject = ['moduleService', '$scope'];

    function ModuleCtrl(moduleService, $scope) {
        /* jshint validthis: true */
        var vm = this;
        
        vm.modules = [];
        vm.installModule = installModule;
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
    }
})();
