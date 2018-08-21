
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
        vm.startModuleSetup = startModuleSetup;
        
        vm.moduleId;

        function init(moduleId, moduleSlug){
            vm.moduleId = moduleId;
            vm.moduleSlug = moduleSlug;
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

        function startModuleSetup(){
            moduleService.config(vm.moduleSlug)
                .then(function(){
                    notificationService.successNotificationTranslated('MODULE.CONFIG_SUCCESS_NOTIFICATION');
                })
                .catch(function(err) {
                    notificationService.errorNotificationTranslated('MODULE.CONFIG_FAIL_NOTIFICATION');
                });
        }

        
    }
})();
