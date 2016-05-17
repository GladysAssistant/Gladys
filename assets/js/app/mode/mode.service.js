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
        .factory('modeService', modeService);

    modeService.$inject = ['$http'];

    function modeService($http) {
        
        var service = {
            get: get, 
            create: create,
            destroy: destroy,
            changeMode: changeMode
        };

        return service;

        function get() {
            return $http({method: 'GET', url: '/mode' });
        }
		
		function create(mode) {
            return $http({method: 'POST', url: '/mode', data: mode });
        }
        
        function destroy(id) {
            return $http({method: 'DELETE', url: '/mode/' + id });
        }
        
        function changeMode(house, mode){
            return $http({method: 'POST', url: '/house/' + house + '/mode', data: {mode: mode} });
        }
    }
})();