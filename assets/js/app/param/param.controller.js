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
        .controller('ParamCtrl', ParamCtrl);

    ParamCtrl.$inject = ['paramService'];

    function ParamCtrl(paramService) {
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
            return paramService.get()
                .then(function(data){
                    vm.params = data.data;
                });
        }
        
        function updateParam(name, param){
            vm.saving = true;
            return paramService.update(name, param)
              .then(function(){
                 vm.saving = false; 
              });
        }
        
        function deleteParam(index, name){
            return paramService.destroy(name)
              .then(function(){
                  vm.params.splice(index, 1);
              });
        }
        
        function createParam(param){
            return paramService.create(param)
              .then(function(data){
                  vm.params.push(data.data);
                  vm.newParam = {};
              });
        }
    }
})();