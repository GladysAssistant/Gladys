(function () {
    'use strict';

    angular
        .module('gladys')
        .controller('weatherCtrl', weatherCtrl);

    weatherCtrl.$inject = ['geoLocationService', 'weatherService', '$scope'];

    function weatherCtrl(geoLocationService, weatherService, $scope) {
        /* jshint validthis: true */
        var vm = this;
        vm.weather = null;
        vm.loading = true;
        
    	var refreshInterval = 30*60*1000;
        activate();

        function activate() {
            setInterval(locateAndCheckWeather,refreshInterval);
            return locateAndCheckWeather();
        }
  
        function locateAndCheckWeather() {
            return geoLocationService.getCurrentPosition()
                .then(function(data){
                    var params = {
                        latitude: data.coords.latitude,
                        longitude: data.coords.longitude
                    };
                    return weatherService.get(params);
                })
                .then(function(data){
                    $scope.$apply(function () {
                        vm.loading = false;
                        vm.weather = data;
                    });
                });
        }
    }
})();