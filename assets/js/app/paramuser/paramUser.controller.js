
(function () {
    'use strict';

    angular
        .module('gladys')
        .controller('ParamUserCtrl', ParamUserCtrl);

    ParamUserCtrl.$inject = ['paramUserService', 'notificationService'];

    function ParamUserCtrl(paramUserService, notificationService) {
        /* jshint validthis: true */
        var vm = this;
        vm.params = [];
        vm.saving = false; 
        
        vm.updateParam = updateParam;
        vm.deleteParam = deleteParam;
        vm.createParam = createParam;
        activate();

        function activate() {
            return get();
        }

        function get() {
            return paramUserService.get()
                .then(function(data){
                    vm.params = data.data;
                });
        }
        
        function updateParam(name, param){
            vm.saving = true;
            return paramUserService.update(name, param)
              .then(function(){
                 vm.saving = false; 
              });
        }
        
        function deleteParam(index, name){
            return paramUserService.destroy(name)
              .then(function(){
                  vm.params.splice(index, 1);
              });
        }
        
        function createParam(param){
            return paramUserService.create(param)
              .then(function(data){
                  vm.params.push(data.data);
                  vm.newParam = {};
              })
              .catch(function(err) {
                if(err.data && err.data.code && err.data.code == 'E_VALIDATION') {
                    for(var key in err.data.invalidAttributes) {
                        if(err.data.invalidAttributes.hasOwnProperty(key)){
                            notificationService.errorNotificationTranslated('PARAM.INVALID_' + key.toUpperCase());
                        }
                    }
                } else {
                    notificationService.errorNotificationTranslated('DEFAULT.ERROR');
                }
             });
        }
    }
})();