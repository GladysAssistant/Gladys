  
(function () {
    'use strict';

    angular
        .module('gladys')
        .factory('eventService', eventService);

    eventService.$inject = ['$http'];

    function eventService($http) {
        
        var service = {
            get: get,
            create: create
        };

        return service;

        function get(take, skip) {
            return $http({method: 'GET', url: '/event', params: {take: take, skip: skip}});
        }

        function create(event) {
            return $http({method: 'POST', url: '/event', data: event});
        }
        
    }
})();