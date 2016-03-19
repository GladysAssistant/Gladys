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
        .factory('boxService', boxService);

    boxService.$inject = ['$http'];

    function boxService($http) {
        
        var service = {
            update: update
        };

        return service;
        
        function update(id, box) {
            return $http({method: 'PATCH', url: '/box/' + id, data: box});
        }
    }
})();