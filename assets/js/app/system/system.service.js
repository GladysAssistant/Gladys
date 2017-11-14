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
        .module('gladys')
        .factory('systemService', systemService);

    systemService.$inject = ['$http'];

    function systemService($http) {
        
        var service = {
            get: get,
            shutdown: shutdown,
            update: update,
            healthCheck: healthCheck
        };

        return service;

        function get(){
            return $http({method: 'GET', url: '/system' });
        }
        
        function shutdown(){
            return $http({method: 'POST', url: '/system/shutdown' });
        }

        function update(){
            return $http({method: 'POST', url: '/system/update' });
        }

        /**
         *  return true if Gladys is live
         *  false if not
         */
        function healthCheck(){
            return $http({method: 'GET', url: '/system/health' })
                .then(function(){
                    return true;
                })
                .catch(function(){
                    return false;
                });
        }
      
        
    }
})();