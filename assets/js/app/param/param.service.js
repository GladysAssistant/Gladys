  
(function () {
    'use strict';

    angular
        .module('gladys')
        .factory('paramService', paramService);

    paramService.$inject = ['$http'];

    function paramService($http) {
        
        var service = {
            get: get,
            getByModule: getByModule,
            create: create, 
            update: update,
            destroy: destroy
        };

        return service;

        function get() {
            return $http({method: 'GET', url: '/param'});
        }

        function getByModule(id) {
            return $http({method: 'GET', url: '/module/' + id + '/param'});
        }
        
        function create(param) {
            return $http({method: 'POST', url: '/param', data: param});
        }
        
        function update(name, param) {
            return $http({method: 'PATCH', url: '/param/' + name, data: param});
        }
        
        function destroy(name) {
            return $http({method: 'DELETE', url: '/param/' + name});
        }
    }
})();