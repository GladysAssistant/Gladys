  
(function () {
    'use strict';

    angular
        .module('gladys')
        .factory('machineService', machineService);

    machineService.$inject = ['$http'];

    function machineService($http) {
        
        var service = {
            create: create,
            get: get, 
            update: update,
            delete: destroy
        };

        return service;

        function get() {
            return $http({method: 'GET', url: '/machine'});
        }
		
		function create(machine) {
            return $http({method: 'POST', url: '/machine', data: machine});
        }

        function update(machine){
            return $http({method: 'PATCH', url: '/machine/' + machine.id, data: machine});
        }

        function destroy(id){
            return $http({method: 'DELETE', url: '/machine/' + id});
        }
	
    }
})();