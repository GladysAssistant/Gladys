/** 
  * Gladys Project
  * http://gladysproject.com
  * Software under licence Creative Commons 3.0 France 
  * http://creativecommons.org/licenses/by-nc-sa/3.0/fr/
  * You may not use this software for commercial purposes.
  * @author :: Pierre-Gilles Leymarie
  */
  
(function () {
    'use strict';

    angular
        .module('app')
        .factory('milightService', milightService);

    milightService.$inject = ['$http'];

    function milightService($http) {
        var service = {
            getAllLamps: getAllLamps,
            switchStatus: switchStatus
        };

        return service;
        /**
         * Return all Milight Lamps
         * @return 
         */
        function getAllLamps() {
            return $http({method: 'POST', url: '/milightlamp/index' }).
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

        function switchStatus(id, action) {
            return $http({method: 'POST', url: '/MilightLamp/' + action, data: {id: id} }).
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