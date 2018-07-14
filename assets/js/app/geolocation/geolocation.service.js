  
(function () {
    'use strict';

    angular
        .module('gladys')
        .factory('geoLocationService', geoLocationService);

    geoLocationService.$inject = ['$http'];

    function geoLocationService($http) {
        
        var service = {
            create: create,
            get: get,
            getByUser: getByUser,
            getCurrentPosition: getCurrentPosition
        };

        return service;

        function create(location) {
            var locationObj = {
              latitude: location.latitude,
              longitude:  location.longitude,
              accuracy: location.accuracy,
              altitude: location.altitude
            };
            return $http({method: 'POST', url: '/location', data: locationObj });
        }

        function get(){
           return $http({ method: 'GET', url: '/location'}); 
        }

        function getByUser(id, options){
            return $http({ method: 'GET', url: '/user/' + id + '/location', params: options}); 
        }

        function getCurrentPosition() {
            return new Promise(function(resolve, reject) {
                if (navigator.geolocation) {
                    var options = {
                        enableHighAccuracy: true,
                        timeout: 5000,
                        maximumAge: 0
                    };
                    navigator.geolocation.getCurrentPosition(resolve, reject, options);
                }else{
                    reject('Navigator not capable of geolocation');
                }
            });
        }
    }
})();