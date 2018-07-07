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
        .controller('ModuleConfigurationCtrl', ModuleConfigurationCtrl);

    ModuleConfigurationCtrl.$inject = ['moduleService', '$scope', 'notificationService', 'storeService', 'paramService', 'moment'];

    function ModuleConfigurationCtrl(moduleService, $scope, notificationService, storeService, paramService, moment) {
        /* jshint validthis: true */
        var vm = this;
        
        vm.init = init;
        vm.updateParam = updateParam;
        
        vm.moduleId;

        function init(moduleId){
            vm.moduleId = moduleId;
            getParam(moduleId);
        }

        function getParam(moduleId){
            paramService.getByModule(moduleId)
                .then(function(data){
                    vm.params = data.data
                });
        }

        function updateParam(name, param){
            vm.saving = true;
            return paramService.update(name, param)
              .then(function(){
                 vm.saving = false; 
              });
        }

        
    }
})();
