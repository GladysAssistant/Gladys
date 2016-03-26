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
        .factory('userService', userService);

    userService.$inject = ['$http'];

    function userService($http) {
        
        var service = {
            create: create, 
            login: login,
            get: get,
            destroy: destroy,
            update: update,
            whoAmI: whoAmI
        };
        
        var user = null;

        return service;

        function whoAmI(){
            
            // looking in cache
            if(user) return Promise.resolve(user);
            
            return $http({method: 'GET', url: '/user/whoami' })
              .then(function(data){
                  
                  // caching current user
                  user = data.data;
                  
                  return data;
              });
        }

        function get(options) {
            return $http({method: 'GET', url: '/user', params: options });
        }
        
        function login(user){
            return $http({method: 'POST', url: '/user/login', data: user});
        }
        
        function create(user){
             return $http({method: 'POST', url: '/user', data: user });
        }
        
        function update(id, user){
             return $http({method: 'PATCH', url: '/user/' + id, data: user });
        }
        
        function destroy(id){
             return $http({method: 'DELETE', url: '/user/' + id});
        }
    }
})();