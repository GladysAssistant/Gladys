  
(function () {
    'use strict';

    angular
        .module('gladys')
        .factory('categoryService', categoryService);

    categoryService.$inject = ['$http'];

    function categoryService($http) {
        
        var service = {
            get:get ,
            getEventTypes: getEventTypes
        };

        return service;

        function get() {
            return $http({method: 'GET', url: '/category' });
        }
        
        function getEventTypes(service){
            return $http({method: 'GET', url: '/category/' + service + '/eventtype' });
        }
    }
})();