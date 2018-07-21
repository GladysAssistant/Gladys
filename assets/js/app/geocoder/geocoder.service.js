  
(function () {
    'use strict';

    angular
        .module('gladys')
        .factory('geoCoderService', geoCoderService);

    geoCoderService.$inject = ['$http'];

    function geoCoderService($http) {
        
        var googleGeocodeUrl = 'http://maps.googleapis.com/maps/api/geocode/json?address=';
        
        var service = {
            locate: locate
        };
        
        return service;

        // locate address and return latitude and longitude
        function locate(address) {
            return $http({method: 'GET', url: googleGeocodeUrl + encodeURIComponent(address) })
              .then(function(data){
                 
                 // if result found by google
                 if(result.results.length && result.results[0].geometry){
                     var latitude = result.results[0].geometry.location.lat;
			         var longitude = result.results[0].geometry.location.lng;
                     return {
                         latitude: latitude,
                         longitude: longitude
                     };
                 } else {
                     return Promise.reject(new Error('No latitude/longitude found'));
                 }
                 
              });
        }
        
    }
})();