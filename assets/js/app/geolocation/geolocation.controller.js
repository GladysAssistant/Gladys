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
    .controller('geoLocationCtrl', geoLocationCtrl);

  geoLocationCtrl.$inject = ['geoLocationService', 'deviceDetector'];

  function geoLocationCtrl(geoLocationService, deviceDetector) {
    /* jshint validthis: true */
    var vm = this;
    vm.geolocation = null;
    vm.mobileGeolocationInterval = 5*60*1000;

    activate();

    function activate() {
      return continuousGeoLocation();
    }

    function continuousGeoLocation() {
      locate();
      if(deviceDetector.isMobile()){
        setInterval(locate, vm.mobileGeolocationInterval);
      }
    }

    function locate() {
      return geoLocationService.getCurrentPosition()
        .then(function(data){
            // vm.geolocation now contains coords
            vm.geolocation = data.coords;
            // Saving coords on the server to tell Gladys
            geoLocationService.create(vm.geolocation)
            .then(function(data){
                // Geolocation Sucessfully saved
            });
        });
    }
  }
})();