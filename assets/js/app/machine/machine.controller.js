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
    	vm.createMachine = createMachine;
        vm.updateMachine = updateMachine;
		vm.deleteMachine = deleteMachine;

        vm.houses = [];
        vm.saving = false;

        activate();

        function activate() {
            getMachines();
            getHouses();
            return ;
        }
        
        function getMachines() {
            return machineService.get()
                .then(function(data){
                    vm.machines = data.data;
                });
        }
        
        function getHouses() {
            return houseService.get()
                .then(function(data){
                    vm.houses = data.data;
                });
        }
		
		function createMachine(machine){
			 return machineService.create(machine)
                .then(function(data){
                    vm.machines.push(data.data);
                    vm.newMachine = {};
                });
		}

        function updateMachine(machine){
            vm.saving = true;
            return machineService.update(machine)
              .then(function(data){
                  vm.saving = false;
              });
        }
		
		function deleteMachine(index, id){
			 return machineService.delete(id)
                .then(function(data){
                    vm.machines.splice(index, 1);
                });
		}
    }
})();
