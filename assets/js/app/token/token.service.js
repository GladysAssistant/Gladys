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
        .factory('tokenService', tokenService);

    tokenService.$inject = ['$http'];

    function tokenService($http) {
        var service = {
            createToken: createToken,
            destroyToken: destroyToken,
            getTokens: getTokens,
            updateStatus: updateStatus
        };

        return service;

        function createToken(name) {
            return $http({method: 'POST', url: '/token/create', data:{name:name} }).
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
        
        function destroyToken(id) {
            return $http({method: 'POST', url: '/token/destroy', data:{id:id} }).
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
        
        function getTokens() {
            return $http({method: 'POST', url: '/token/index' }).
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
        
        function updateStatus(id, status) {
            return $http({method: 'POST', url: '/token/updateStatus', data:{id:id, status:status} }).
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