
(function () {
    'use strict';

    angular
        .module('gladys')
        .factory('roomService', roomService);

    roomService.$inject = ['$http'];

    function roomService($http) {
        
        var service = {
            create: create,
            get: get,
            destroy: destroy,
            update: update
        };

        return service;

        function get(options) {
            return $http({method: 'GET', url: '/room', params: options });
        }
        
        function create(room){
            return $http({method: 'POST', url: '/room', data: room });
        }
        
        function destroy(id){
            return $http({method: 'DELETE', url: '/room/' + id });
        }
        
        function update(id, room){
            return $http({method: 'PATCH', url: '/room/' + id, data: room });
        }

    }
})();