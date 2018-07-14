
(function () {
  'use strict';

  angular
    .module('gladys')
    .controller('WeatherCtrl', WeatherCtrl);

  WeatherCtrl.$inject = ['weatherService', 'geoLocationService', 'cacheService', 'notificationService', '$timeout', 'houseService'];

  function WeatherCtrl(weatherService, geoLocationService, cacheService, notificationService, $timeout, houseService) {

    /* jshint validthis: true */
    var vm = this;
    vm.weather = [];
    var EXPIRATION = 30*60*1000;
    
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

            // trying to geoloc from browser
            return geoLocationService.getCurrentPosition()
              .catch(function(err) {

                // if it fails, fallback from house
                return houseService.get()
                  .then(function(data){
                      var houses = data.data;
                      if(houses.length === 0) {
                        return Promise.reject(new Error('NO_HOUSE_DEFINED'));
                      } else {
                        var geolocData = {
                          coords: {
                            latitude: houses[0].latitude,
                            longitude: houses[0].longitude,
                            accuracy: 0
                          }
                        };
                        return geolocData;
                      }
                  });
              })
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
              })
              .catch(function(err) {
                  if(err && err.message == 'NO_HOUSE_DEFINED') {
                    notificationService.errorNotificationTranslated('WEATHER.GET_GEOLOCATION_FAILED_CREATE_HOUSE'); 
                  } else {
                    notificationService.errorNotificationTranslated('WEATHER.GET_GEOLOCATION_FAILED', err);
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