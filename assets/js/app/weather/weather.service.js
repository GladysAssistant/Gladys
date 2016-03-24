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
        .factory('weatherService', weatherService);

    weatherService.$inject = ['$http','cacheService'];

    function weatherService($http, cacheService) {
        
        var service = {
            get: get
        };
        
        // the expiration time of the weather in cache
        // set to 20 minutes here
        var EXPIRATION_TIME = 20*60*1000;
        
        return service;
        
        function get(params){
            
            // try to get weather from cache first
            var weather = cacheService.get('weather');

            if(weather) {
                console.log('Getting weather from cache');
                return weather;
            }
            
            return $http({method: 'GET', url: '/weather', params: params })
                .then(function(data) {
                    cacheService.set('weather', data.data, EXPIRATION_TIME);
                    return data.data;
                });
        }
        
    }
})();