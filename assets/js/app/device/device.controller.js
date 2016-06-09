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
    .controller('DeviceCtrl', DeviceCtrl);

  DeviceCtrl.$inject = ['deviceService','roomService', '$scope'];

  function DeviceCtrl(deviceService, roomService, $scope) {
    /* jshint validthis: true */
    var vm = this;
    
    vm.selectDevice = selectDevice;
    vm.changeValue = changeValue;
    vm.updateDeviceType = updateDeviceType;
    vm.changeTypeDisplay = changeTypeDisplay;
    vm.saving = false;
    vm.devices = [];
    vm.rooms = [];
    vm.selectedDevice = {
        types: []
    };
    
    vm.updateDevice = updateDevice;

    activate();

    function activate() {
      getDevices();
      getRooms();
      getDeviceTypesByRoom();
      waitForNewValue();
      return ;
    }
    
    
    function getDevices() {
      return deviceService.get()
        .then(function(data){
          vm.devices = data.data;
        });
    }
    
    function getDeviceTypesByRoom(){
       return deviceService.getDeviceTypeByRoom()
         .then(function(data){
            vm.roomDeviceTypes = data.data; 
         });
    }
    
    function getRooms(){
        return roomService.get()
          .then(function(data){
              vm.rooms = data.data;
          });
    }
    
    function updateDevice(device){
        console.log('Updating device ' + device.name);
        vm.saving = true;
        var newDevice = {
            id: device.id,
            room: device.room.id,
            name: device.name
        };
        return deviceService.updateDevice(newDevice)
             .then(function(device){
                 vm.saving = false;
             })
             .catch(function(err){
                vm.saving = false;
             });
    }
    
    function selectDevice(device){
        vm.selectedDevice = device;
        return deviceService.getDeviceTypesDevice(device.id)
          .then(function(data){
              vm.selectedDevice.types = data.data;
          });
    }
    
    function changeValue(deviceType, value){
        return deviceService.exec(deviceType, value)
          .then(function(data){
             deviceType.lastValue = data.data.value; 
          });
    }
    
    function updateDeviceType(deviceType){
        return deviceService.updateDeviceType(deviceType)
            .then(function(){
                
            });
    }
    
    function changeTypeDisplay(type){
        if(type.display) type.display = 0;
        else type.display = 1;
        
        return updateDeviceType(type);
    }
    
     // waiting for websocket message
    function waitForNewValue(){
        
        io.socket.on('newDeviceState', function (deviceState) {
            console.log(deviceState);
            updateValueType(deviceState);
        });
    }
    
    // loop foreach device and upadte the value when the type is found
    function updateValueType(deviceState){
        var found = false;
        var i = 0;
        if(vm.selectedDevice.types){
            while(!found && i < vm.selectedDevice.types.length){

                if(vm.selectedDevice.types[i].id == deviceState.devicetype){
                    found = true;
                    vm.selectedDevice.types[i].lastValue = deviceState.value;
                    vm.selectedDevice.types[i].lastChanged = deviceState.datetime;
                    $scope.$apply();
                }
                i++;
            }
        }
    }
    
  }
})();