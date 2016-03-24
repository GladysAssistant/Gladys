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
        .controller('machineCtrl', machineCtrl);

    machineCtrl.$inject = ['machineService', 'houseService'];

    function machineCtrl(machineService, houseService) {
        /* jshint validthis: true */
        var vm = this;
        vm.machines = [];
        vm.relations = [];
    	vm.createMachine = createMachine;
		vm.destroyMachine = destroyMachine;
        activate();

        function activate() {
            getMachines();
            getHouses();
            return ;
        }
        
        function getMachines() {
            return machineService.getMachines()
                .then(function(data){
                    vm.machines = data.data;
                });
        }
        
        function getHouses() {
            return houseService.getHouses()
                .then(function(data){
                    vm.relations = data.data;
                });
        }
		
		function createMachine(){
			 return machineService.createMachine(vm.newMachine)
                .then(function(data){
                    vm.machines.push(data.data);
                });
		}
		
		function destroyMachine(index, id){
			 return machineService.destroyMachine(id)
                .then(function(data){
                    vm.machines.splice(index, 1);
                });
		}
    }
})();
