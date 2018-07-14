  
(function () {
    'use strict';

    angular
        .module('gladys')
        .factory('boxService', boxService);

    boxService.$inject = ['$http'];

    function boxService($http) {
        
        var service = {
            get:get, 
            getById: getById,
            create:create,
            destroy: destroy,
            update: update
        };

        return service;
        
        function get() {
            return $http({method: 'GET', url: '/box' });
        }
        
        function create(box) {
            return $http({method: 'POST', url: '/box', data: box});
        }

        function getById(id){
            return $http({method: 'GET', url: '/box/' + id});
        }
        
        function destroy(id){
            return $http({method: 'DELETE', url: '/box/' + id});
        }
        
        function update(id, box) {
            return $http({method: 'PATCH', url: '/box/' + id, data: box});
        }
    }
})();