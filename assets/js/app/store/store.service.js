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

    storeService.$inject = ['$http', 'userService'];

    function storeService($http, userService) {
        
        var service = {
            getModules: getModules,
            getReviews: getReviews,
            getVersions: getVersions,
            saveDownload: saveDownload,
            getModuleInfos: getModuleInfos
        };

        return service;

        function getModules(take, skip){
            return userService.whoAmI()
              .then(function(user){
                  var lang = user.language.substring(0,2).toLowerCase();
                  return $http({method: 'GET', url: 'https://developer.gladysproject.com/api/v1/modules', params: {take: take, skip: skip, lang: lang} }); 
              });
        }
        
        function getReviews(id){
            return $http({method: 'GET', url: 'https://developer.gladysproject.com/api/v1/modules/' + id + '/reviews' });
        }
        
        function getVersions(id){
            return $http({method: 'GET', url: 'https://developer.gladysproject.com/api/v1/modules/' + id + '/versions' });
        }
        
        function getModuleInfos(slug){
            return userService.whoAmI()
              .then(function(user){
                  var lang = user.language.substring(0,2).toLowerCase();
                  return $http({method: 'GET', url: 'https://developer.gladysproject.com/api/v1/modules/' + slug, params: {lang: lang} });
              });
        }
        
        function saveDownload(id){
            return $http({method: 'POST', url: 'https://developer.gladysproject.com/api/v1/modules/' + id + '/download' });
        }
      
        
    }
})();