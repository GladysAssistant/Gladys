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

    machineCtrl.$inject = ['machineService', 'houseService', 'roomService', '$q'];

    function machineCtrl(machineService, houseService, roomService, $q) {
        /* jshint validthis: true */
        var vm = this;
    	vm.createMachine = createMachine;
        vm.updateMachine = updateMachine;
		vm.deleteMachine = deleteMachine;

        vm.houses = [];
        vm.rooms = [];
        vm.saving = false;

        activate();

        function activate() {
            $q.all([getRooms(), getHouses()])
                .then(function(){
                    getMachines();
                });
            
            return ;
        }
        
        function getMachines() {
            return machineService.get()
                .then(function(data){
                    vm.machines = data.data;
                });
        }
        
        function getHouses() {
            return houseService.get({take: 10000})
                .then(function(data){
                    vm.houses = data.data;
                });
        }

        function getRooms() {
            return roomService.get({take: 10000})
                .then(function(data){
                    vm.rooms = data.data;
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
