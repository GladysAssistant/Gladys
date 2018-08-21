  
(function () {
    'use strict';

    angular
        .module('gladys')
        .factory('installationService', installationService);

    installationService.$inject = ['$http'];

    function installationService($http) {
        var service = {
           
        }; 

        return service;

        function saveGeoLocation(geolocationObj) {
            return $http({method: 'POST', url: '/Location/create', data : geolocationObj }).
                success(function(data, status, headers, config) {
                    // this callback will be called asynchronously
                    // when the response is available
                    return data;
                }).
                error(function(data, status, headers, config) {
                    // called asynchronously if an error occurs
                    // or server returns response with an error status.
                });
        }

        function getGeoLocation() {
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