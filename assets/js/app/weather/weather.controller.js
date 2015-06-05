(function () {
    'use strict';

    angular
        .module('app')
        .controller('weatherCtrl', weatherCtrl);

    weatherCtrl.$inject = ['geoLocationService'];

    function weatherCtrl(geoLocationService) {
        /* jshint validthis: true */
        var vm = this;
    	var refreshInterval = 30*60*1000;
        activate();

        function activate() {
            setInterval(locateAndCheckWeather,refreshInterval);
            return locateAndCheckWeather();
        }
    	
        function loadWeather(location, woeid) {
            $.simpleWeather({
              location: location,
              woeid: woeid,
              unit: 'c',
              success: function(weather) {
                var html = '<h2>' + weather.temp + '&deg;' + weather.units.temp + '</h2>';
                html += '<ul><li>' + weather.city + '</li>';
                //html += '<li class="currently">'+weather.currently+'</li>'; 
        
                $("#weather").hide();
                $("#weather").html(html);
                $("#weather").fadeIn(600);
                $("waitspinner").hide();
              },
              error: function(error) {
                $("#weather").html('<p>' + error + '</p>');
              }
            });
         }
  
        function locateAndCheckWeather() {
            return geoLocationService.getGeoLocation()
                .then(function(data){
                    loadWeather(data.coords.latitude+','+data.coords.longitude);
                });
        }
    }
})();