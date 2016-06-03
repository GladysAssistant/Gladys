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
        .factory('storeService', storeService);

    storeService.$inject = ['$http'];

    function storeService($http) {
        
        var service = {
            getModules: getModules,
            getReviews: getReviews,
            getVersions: getVersions
        };

        return service;

        function getModules(take, skip){
            return $http({method: 'GET', url: 'https://developer.gladysproject.com/api/v1/modules', params: {take: take, skip: skip} });
        }
        
        function getReviews(id){
            return $http({method: 'GET', url: 'https://developer.gladysproject.com/api/v1/modules/' + id + '/reviews' });
        }
        
        function getVersions(id){
            return $http({method: 'GET', url: 'https://developer.gladysproject.com/api/v1/modules/' + id + '/versions' });
        }
      
        
    }
})();