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
        .controller('BoxCtrl', BoxCtrl);

    BoxCtrl.$inject = ['boxService'];

    function BoxCtrl(boxService) {
        /* jshint validthis: true */
        var vm = this;
        vm.remove = remove;
        vm.update = update;

        activate();

        function activate() {
            
        }
        
        function remove(id){
            return update(id, {active: 0});
        }
        
        function update(id, box){
            return boxService.update(id, box);
        }
        
       
    }
})();