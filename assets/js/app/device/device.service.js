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
        .factory('deviceService', deviceService);

    deviceService.$inject = ['$http'];

    function deviceService($http) {
        
        var service = {
            get: get,
            updateDevice: updateDevice,
            deleteDevice: deleteDevice,
            getDeviceTypesDevice: getDeviceTypesDevice,
            getTypes: getTypes,
            updateDeviceType: updateDeviceType,
            deleteDeviceType: deleteDeviceType,
            exec: exec,
            getStates: getStates
        };

        return service;
        
        // all about devices 
        
        function get() {
            return $http({method: 'GET', url: '/device'});
        }
        
        function updateDevice(device){
            return $http({method: 'PATCH', url: '/device/' + device.id, data: device});
        }
        
        function deleteDevice(device){
            return $http({method: 'DELETE', url: '/device/' + device.id, data: device});
        }
        
        function getDeviceTypesDevice(id){
            return $http({method: 'GET', url: '/device/' + id + '/devicetype'});
        }
        
        
        // all about deviceTypes
        function getTypes(){
            return $http({method: 'GET', url: '/devicetype'});
        }
        
        function updateDeviceType(deviceType){
            return $http({method: 'PATCH', url: '/devicetype/' + deviceType.id, data: deviceType});
        }
        
        function deleteDeviceType(deviceType){
            return $http({method: 'DELETE', url: '/devicetype/' + deviceType.id, data: deviceType});
        }
        
        function exec(deviceType, value){
            return $http({method: 'POST', url: '/devicetype/' + deviceType.id + '/exec', data: {value: value}});
        }
        
        // all about deviceStates
        function getStates(deviceType, skip){
            return $http({method: 'GET', url: '/devicestate', params: {devicetype: deviceType, skip:skip}});
        }
    }
})();