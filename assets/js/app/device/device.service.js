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
            create: create,
            updateDevice: updateDevice,
            deleteDevice: deleteDevice,
            getDeviceTypeByRoom: getDeviceTypeByRoom,
            createDeviceType: createDeviceType,
            getDeviceTypesDevice: getDeviceTypesDevice,
            getTypes: getTypes,
            updateDeviceType: updateDeviceType,
            deleteDeviceType: deleteDeviceType,
            exec: exec,
            getStates: getStates
        };

        return service;
        
        // all about devices 

        function get(take, skip) {
            return $http({method: 'GET', url: '/device', params: {take: take, skip: skip}});
        }

        function create(device, types){
            var data = {
                device: device || {},
                types: types || []
            };
            return $http({method: 'POST', url: '/device', data: data});
        }
        
        function updateDevice(device){
            return $http({method: 'PATCH', url: '/device/' + device.id, data: device});
        }
        
        function deleteDevice(id){
            return $http({method: 'DELETE', url: '/device/' + id});
        }
        
        function getDeviceTypesDevice(id){
            return $http({method: 'GET', url: '/device/' + id + '/devicetype'});
        }
        
        
        // all about deviceTypes
        function getTypes(){
            return $http({method: 'GET', url: '/devicetype'});
        }

        function createDeviceType(deviceType){
            return $http({method: 'POST', url: '/devicetype', data: deviceType});
        }
        
        function updateDeviceType(deviceType){
            return $http({method: 'PATCH', url: '/devicetype/' + deviceType.id, data: deviceType});
        }
        
        function deleteDeviceType(id){
            return $http({method: 'DELETE', url: '/devicetype/' + id});
        }
        
        function exec(deviceType, value){
            return $http({method: 'POST', url: '/devicetype/' + deviceType.id + '/exec', data: {value: value}});
        }
        
        function getDeviceTypeByRoom(){
            return $http({method: 'GET', url: '/devicetype/room'});
        }
        
        // all about deviceStates
        function getStates(deviceType, skip){
            return $http({method: 'GET', url: '/devicestate', params: {devicetype: deviceType, skip:skip}});
        }
    }
})();