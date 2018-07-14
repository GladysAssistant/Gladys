  
(function () {
    'use strict';

    angular
        .module('gladys')
        .factory('sleepService', sleepService);

    sleepService.$inject = ['$http'];

    function sleepService($http) {
        var service = {
            getSleep: getSleep
        };

        return service;

        function getSleep() {
            return $http({method: 'POST', url: '/LifeEvent/getSleep' }).
                success(function(data, status, headers, config) {
                    // this callback will be called asynchronously
                    // when the response is available
                    return data;
                }).
                error(function(data, status, headers, config) {
                    // called asynchronously if an error occurs
                    // or server returns response with an error status.
                });
        }
    }
})();