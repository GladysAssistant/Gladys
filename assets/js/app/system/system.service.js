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
            get: get
        };

        return service;

        function get(){
            return $http({method: 'GET', url: '/system' });
        }
      
        
    }
})();