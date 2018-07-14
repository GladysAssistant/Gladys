
(function () {
    'use strict';

    angular
        .module('gladys')
        .factory('sensorService', sensorService);

    sensorService.$inject = ['$http'];

    function sensorService($http) {

        var service = {
            createSensor: createSensor,
            deleteSensor: deleteSensor,
            getSensors: getSensors,
            switchDiscoveryMode: switchDiscoveryMode,
            waitForSignal: waitForSignal
        };

        return service;

        function createSensor(sensor) {
            return $http({method: 'POST', url: '/MotionSensor/create', data: sensor}).
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

        function deleteSensor(id) {
            return $http({method: 'POST', url: '/MotionSensor/destroy', data: { id: id } }).
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

        function getSensors() {
            return $http({method: 'POST', url: '/MotionSensor/index' }).
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

        function switchDiscoveryMode() {
            return new Promise(function(resolve, reject) {
                io.socket.post('/motionsensor/startWaitingForConnection', {}, function (data, jwres){
                    return resolve(data);
                });
            });
        }

        function waitForSignal() {
            return new Promise(function(resolve, reject) {
                io.socket.on('newMotionSensor', function (data) {
                    return resolve(data);
                }); 
            });
        }
    }
})();