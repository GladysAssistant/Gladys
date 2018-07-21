  
(function () {
    'use strict';

    angular
        .module('gladys')
        .factory('boxTypeService', boxTypeService);

    boxTypeService.$inject = ['$http'];

    function boxTypeService($http) {
        
        var service = {
            get:get
        };

        return service;
        
        function get() {
            return $http({method: 'GET', url: '/boxtype' });
        }
    }
})();