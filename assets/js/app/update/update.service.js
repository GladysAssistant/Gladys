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
        .factory('updateService', updateService);

    updateService.$inject = ['$http'];

    function updateService($http) {
        
        var service = {
            verify: verify,
        };

        return service;

        function verify() {
            return $http({method: 'GET', url: '/update/verify'});
        }
    }
})();