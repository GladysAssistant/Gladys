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
        .module('app')
        .controller('ModuleCtrl', ModuleCtrl);

    ModuleCtrl.$inject = ['moduleService'];

    function ModuleCtrl(moduleService) {
        /* jshint validthis: true */
        var vm = this;
        
        vm.modules = [];
        
        activate();

        function activate() {
            get();
        }
        
       function get(){
           return moduleService.get()
             .then(function(data){
                vm.modules = data.data; 
             });
       }
    }
})();
