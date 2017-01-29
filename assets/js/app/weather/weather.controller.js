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
    .controller('WeatherCtrl', WeatherCtrl);

  WeatherCtrl.$inject = ['weatherService', 'geoLocationService', 'cacheService', '$timeout'];

  function WeatherCtrl(weatherService, geoLocationService, cacheService, $timeout) {

    /* jshint validthis: true */
    var vm = this;
    vm.weather = [];
    var EXPIRATION = 30*60*60*1000;
    
    activate();

    function activate() {
      refresh();
      
      // Start the timer
      $timeout(tick, 1000);
      return ;
    }

   function tick () {
        vm.currentTime = Date.now();
        $timeout(tick, 1000);
    }

    function refresh() {

        // first get GEOLOCATION from cache if exist
        var coords = cacheService.get('GEOLOCATION_USER');
        
        // if geoloc exist in cache
        if(coords) {
            return getWeather(coords);
        } 
        // if not, get geoloc from browser
        else {
            return geoLocationService.getCurrentPosition()
              .then(function(data) {

                  if(data.coords && data.coords.latitude && data.coords.longitude) {

                    var geoloc = {
                      latitude: data.coords.latitude,
                      longitude: data.coords.longitude,
                      accuracy: data.coords.accuracy
                    };
                    
                    // save geoloc in cache
                    cacheService.set('GEOLOCATION_USER', geoloc, EXPIRATION);
                    return getWeather(geoloc);
                  } else {

                    return null;
                  }
              });
        }
    }

    function getWeather(coords) {
        
        var latitude = coords.latitude;
        var longitude = coords.longitude;

        return weatherService.get({latitude: latitude, longitude: longitude})
            .then(function(data) {
                vm.weather[0] = data.data;

                // get weather in 
                return weatherService.get({latitude: latitude, longitude: longitude, offset: 24});
            })
            .then(function(data) {

                vm.weather[1] = data.data;

                // get weather in 48h
                return weatherService.get({latitude: latitude, longitude: longitude, offset: 48});
            })
            .then(function(data) {

              vm.weather[2] = data.data;

                // get weather in 72h
                return weatherService.get({latitude: latitude, longitude: longitude, offset: 72});
            })
            .then(function(data) {
              
              vm.weather[3] = data.data;
            });
     }
    
  }
})();