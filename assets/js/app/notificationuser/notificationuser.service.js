  
(function () {
    'use strict';

    angular
        .module('gladys')
        .factory('notificationUserService', notificationUserService);

    notificationUserService.$inject = ['$http'];

        function notificationUserService($http) {
        
        var service = {
            get: get, 
            getTypes: getTypes,
            create: create,
            update: update,
            destroy: destroy
        };

        return service;

        function get() {
            return $http({method: 'GET', url: '/notificationuser'});
        }
        
        function getTypes(){
            return $http({method: 'GET', url: '/notificationtype'});
        }
        
        function create(notificationUser) {
            return $http({method: 'POST', url: '/notificationuser', data: notificationUser});
        }
        
        function update(id, notificationUser) {
            return $http({method: 'PATCH', url: '/notificationuser/' + id, data: notificationUser});
        }
        
        function destroy(id) {
            return $http({method: 'DELETE', url: '/notificationuser/' + id});
        }
        
    }
})();