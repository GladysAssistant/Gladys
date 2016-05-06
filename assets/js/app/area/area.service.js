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
        .factory('areaService', areaService);

    areaService.$inject = ['$http'];

    function areaService($http) {
        
        var service = {
            create: create,
            get: get,
            update: update,
            destroy: destroy 
        };

        return service;

        function create(area) {
            return $http({method: 'POST', url: '/area', data: area });
        }
        
        function get() {
            return $http({method: 'GET', url: '/area' });
        }
        
        function update(id, area) {
            return $http({method: 'PATCH', url: '/area/' + id, data: area });
        }
        
        function destroy(id) {
            return $http({method: 'DELETE', url: '/area/' + id});
        }

    }
})();