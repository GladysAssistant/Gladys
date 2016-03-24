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
        .factory('machineService', machineService);

    machineService.$inject = ['$http'];

    function machineService($http) {
        var service = {
            getMachines:getMachines,
			createMachine: createMachine,
			destroyMachine: destroyMachine
        };

        return service;

        function getMachines() {
            return $http({method: 'POST', url: '/machine/index'}).
                success(function(data, status, headers, config) {
                    // this callback will be called asynchronously
                    // when the response is available
                    return data;
                }).
                error(function(data, status, headers, config) {
                    // called asynchronously if an error occurs
                    // or server returns response with an error status.
                    
                });
        }
		
		function createMachine(machine) {
            return $http({method: 'POST', url: '/machine/create', data:machine}).
                success(function(data, status, headers, config) {
                    // this callback will be called asynchronously
                    // when the response is available
                    return data;
                }).
                error(function(data, status, headers, config) {
                    // called asynchronously if an error occurs
                    // or server returns response with an error status.
                    
                });
        }
		
		function destroyMachine(id) {
            return $http({method: 'POST', url: '/machine/destroy', data:{id:id}}).
                success(function(data, status, headers, config) {
                    // this callback will be called asynchronously
                    // when the response is available
                    return data;
                }).
                error(function(data, status, headers, config) {
                    // called asynchronously if an error occurs
                    // or server returns response with an error status.
                    
                });
        }
    }
})();