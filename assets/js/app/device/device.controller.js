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

  DeviceCtrl.$inject = ['deviceService','roomService', 'userService', '$scope', 'notificationService'];

  function DeviceCtrl(deviceService, roomService, userService, $scope, notificationService) {
    /* jshint validthis: true */
    var vm = this;
    
    vm.selectDevice = selectDevice;
    vm.changeValue = changeValue;
    vm.updateDeviceType = updateDeviceType;
    vm.changeTypeDisplay = changeTypeDisplay;
    vm.changeTypeSensor = changeTypeSensor;
    vm.createDevice = createDevice;
    vm.deleteDevice = deleteDevice;
    vm.createDeviceType = createDeviceType;
    vm.deleteDeviceType = deleteDeviceType;
    vm.loadMore = loadMore;
    vm.startValue = 0;
    vm.nbElementToGet = 50;
    vm.remoteIsBusy = false;
    vm.noMoreElements = false;
    vm.getDeviceTypesByRoom = getDeviceTypesByRoom;
    
    vm.saving = false;
    vm.ready = false;
    vm.devices = [];
    vm.rooms = [];
    vm.users = [];
    vm.selectedDevice = {
        types: []
    };
    
    vm.updateDevice = updateDevice;

    activate();

    function activate() {
        
      // get deviceType first
      getDeviceTypesByRoom()
        .then(function(){
            vm.ready = true;
            getRooms();
            getUsers();
            loadMore();
        });
      waitForNewValue();
      return ;
    }

    function loadMore(){
        if(!vm.remoteIsBusy && !vm.noMoreElements){
            getDevices(vm.nbElementToGet, vm.startValue);
            vm.startValue += vm.nbElementToGet; 
        }
    }
    
    function getDevices(take, skip) {
      vm.remoteIsBusy = true;
      return deviceService.get(take, skip)
        .then(function(data){
            if(data.data.length === 0){
                vm.noMoreElements = true;
            }
            vm.devices = vm.devices.concat(data.data);
            vm.remoteIsBusy = false;
        });
    }
    
    function getDeviceTypesByRoom(){
       return deviceService.getDeviceTypeByRoom()
         .then(function(data){
            vm.roomDeviceTypes = [];

            // only display rooms that have devices inside
            data.data.forEach(function (room) {
                var numberOfDevices = 0;
                room.deviceTypes.forEach(function (deviceType) {
                    if(deviceType.display) numberOfDevices++;
                });
                if(numberOfDevices > 0) vm.roomDeviceTypes.push(room);
            });
         });
    }
    
    function getRooms(){
        return roomService.get()
          .then(function(data){
              vm.rooms = data.data;
              vm.rooms.unshift({id: null, name: '----'});
          });
    }

    function getUsers(){
        return userService.get()
            .then(function(data) {
                vm.users = data.data;
                vm.users.unshift({id: null, name: '----'});
            });
    }

    function createDevice(device){
        return deviceService.create(device)
           .then(function(data){
               vm.newDevice = {};
           })
           .catch(function(err) {
                if(err.data && err.data.code && err.data.code == 'E_VALIDATION') {
                    for(var key in err.data.invalidAttributes) {
                        if(err.data.invalidAttributes.hasOwnProperty(key)){
                            notificationService.errorNotificationTranslated('DEVICE.INVALID_' + key.toUpperCase());
                        }
                    }
                } else {
                    notificationService.errorNotificationTranslated('DEFAULT.ERROR');
                }
           });
    }   

    function deleteDevice(index, id){
        return deviceService.deleteDevice(id)
          .then(function(){
              vm.devices.splice(index, 1);
          });
    }
    
    function updateDevice(device){
        console.log('Updating device ' + device.name);
        vm.saving = true;
        var newDevice = {
            id: device.id,
            room: device.room.id,
            user: device.user,
            name: device.name,
            identifier: device.identifier,
            protocol: device.protocol,
            service: device.service
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
        vm.newType = {
            device: device.id
        };
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

    function createDeviceType(deviceType){
        deviceType.sensor = deviceType.sensor || false;
        return deviceService.createDeviceType(deviceType)
          .then(function(data){
              vm.selectedDevice.types.push(data.data);
               vm.newType = {
                    device: vm.selectedDevice.id
               };
          })
          .catch(function(err) {
            if(err.data && err.data.code && err.data.code == 'E_VALIDATION') {
                for(var key in err.data.invalidAttributes) {
                    if(err.data.invalidAttributes.hasOwnProperty(key)){
                        notificationService.errorNotificationTranslated('DEVICETYPE.INVALID_' + key.toUpperCase());
                    }
                }
            } else {
                notificationService.errorNotificationTranslated('DEFAULT.ERROR');
            }
       });
    }

    function deleteDeviceType(index, id){
        return deviceService.deleteDeviceType(id)
          .then(function(data){
              vm.selectedDevice.types.splice(index, 1);
          });
    }
    
    function changeTypeDisplay(type){
        if(type.display) type.display = 0;
        else type.display = 1;
        
        return updateDeviceType(type);
    }
    
    function changeTypeSensor(type){
        if(type.sensor) type.sensor = 0;
        else type.sensor = 1;
        
        return updateDeviceType(type);
    }
   
     // waiting for websocket message
    function waitForNewValue(){
        
        io.socket.on('newDeviceState', function (deviceState) {
            updateValueType(deviceState);
            updateRoomView(deviceState);
        });

        io.socket.on('newDevice', function (result) {
            vm.devices.push(result.device);
            $scope.$apply();
        });
    }

    function updateRoomView(newDeviceState) {
        if(vm.roomDeviceTypes instanceof Array) {
            vm.roomDeviceTypes.forEach(function(room) {
                room.deviceTypes.forEach(function(type){
                    if(type.id === newDeviceState.devicetype){
                        type.lastValue = newDeviceState.value;
                        type.lastChanged = newDeviceState.datetime;
                        $scope.$apply();
                    }
                });
            });
        }
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
