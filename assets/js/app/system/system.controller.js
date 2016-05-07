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
        .controller('SystemCtrl', SystemCtrl);

    SystemCtrl.$inject = ['systemService'];

    function SystemCtrl(systemService) {
        /* jshint validthis: true */
        var vm = this;
        
        vm.infos = {};
        
        activate();

        function activate() {
            get();
        }
        
       function get(){
           return systemService.get()
             .then(function(data){
                vm.infos = data.data; 
             });
       }
    }
})();
