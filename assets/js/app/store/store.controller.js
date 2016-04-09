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
        .controller('StoreCtrl', StoreCtrl);

    StoreCtrl.$inject = ['storeService'];

    function StoreCtrl(storeService) {
        /* jshint validthis: true */
        var vm = this;
        
        vm.modules = [];
        
        activate();

        function activate() {
            getModules();
        }
        
       function getModules(){
           return storeService.getModules()
             .then(function(data){
                vm.modules = data.data; 
             });
       }
    }
})();
