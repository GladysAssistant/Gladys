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
        .factory('pushBulletService', pushBulletService);

    pushBulletService.$inject = ['$http'];

    function pushBulletService($http) {
        var service = {
			createParametre:createParametre,
			destroyParametre: destroyParametre,
            getParametres:getParametres,
			
        };

        return service;

        function getParametres() {
            return $http({method: 'POST', url: '/pushbullet/index'}).
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
		
		function createParametre(parametre) {
            return $http({method: 'POST', url: '/pushbullet/create', data:parametre}).
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
		
		function destroyParametre(id) {
            return $http({method: 'POST', url: '/pushbullet/destroy', data:{id:id}}).
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