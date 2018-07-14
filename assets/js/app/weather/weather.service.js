
(function () {
    'use strict';

    angular
        .module('gladys')
        .factory('weatherService', weatherService);

    weatherService.$inject = ['$http'];

    function weatherService($http) {
        
        var service = {
            get: get
        };

        return service;
    
        function get(options) {
            return $http({method: 'GET', url: '/weather', params: options });
        }
    }
})();