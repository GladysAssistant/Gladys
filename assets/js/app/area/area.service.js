  
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