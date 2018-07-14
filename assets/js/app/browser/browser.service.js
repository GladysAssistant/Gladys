  
(function () {
    'use strict';

    angular
        .module('gladys')
        .factory('browserService', browserService);

    browserService.$inject = ['deviceDetector', 'cacheService', 'deviceService', 'userService'];

    function browserService(deviceDetector, cacheService, deviceService, userService) {
        
        /*var service = {
            detectDevice: detectDevice,
            startRecordingBattery: startRecordingBattery
        };

        var timeBetweenBatteryRecording = 1000*60*30;

        return service;

        function recordBattery(){
            if(navigator.getBattery){
                navigator.getBattery().then(function(result) {

                });
            }
        }

        function startRecordingBattery(){
            recordBattery();
            setInterval(recordBattery, timeBetweenBatteryRecording);
        }

        function detectDevice(){
            var deviceId = cacheService.get('DEVICE_ID');
            if(deviceId === null){
                return createDevice();
            } else {
                return Promise.resolve();
            }
        }


        // Create a device with a battery type
        //So we can record the battery of the user
        function createDevice(){
            var deviceId;

            // getting the user name 
            return userService.whoAmI()
              .then(function(user){

                    // creating the device with deviceName
                    var deviceName = deviceService.device + ' - ' + user.firstname;
                    return deviceService.create({
                        name: deviceName,
                        protocol: 'http',
                        service: 'device'
                    }); 
              })
              .then(function(data){

                    // creating deviceType battery
                    deviceId = data.data.id;
                    return deviceService.createType({
                        device: data.data.id,
                        sensor: true,
                        type: 'battery',
                        unit: '%',
                        min: 0,
                        max: 100
                    });
              })
              .then(function(){

                  // saving the device ID in localstorage
                  return cacheService.set('DEVICE_ID', deviceId, 1000*60*60*24*365*100);
              });
        }*/
        
    }
})();