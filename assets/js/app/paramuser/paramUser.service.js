
(function () {
    'use strict';

    angular
        .module('gladys')
        .factory('paramUserService', paramUserService);

    paramUserService.$inject = ['$http'];

    function paramUserService($http) {
        
        var service = {
            get: get,
            create: create, 
            update: update,
            destroy: destroy
        };

        return service;

        function get() {
            return $http({method: 'GET', url: '/paramuser'});
        }
        
        function create(param) {
            return $http({method: 'POST', url: '/paramuser', data: param});
        }
        
        function update(name, param) {
            return $http({method: 'PATCH', url: '/paramuser/' + name, data: param});
        }
        
        function destroy(name) {
            return $http({method: 'DELETE', url: '/paramuser/' + name});
        }
    }
})();