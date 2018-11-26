
 (function () {
    'use strict';
  
    angular
      .module('gladys')
      .controller('DeviceRoomBoxController', DeviceRoomBoxController);
  
      DeviceRoomBoxController.$inject = ['deviceService','roomService', 'userService', 'boxService' ,'$scope', 'notificationService'];
  
    function DeviceRoomBoxController(deviceService, roomService, userService, boxService, $scope, notificationService) {
      /* jshint validthis: true */
      var vm = this;

      vm.init = init;
      vm.selectRoomId = selectRoomId;
      vm.changeValue = changeValue;
  
      function init(id) {
        vm.boxId = id;
        boxService.getById(id)
            .then(function(data) {
                vm.box = data.data;
                if(vm.box.params && vm.box.params.room) {
                    vm.selectRoom = false;
                    vm.roomId = vm.box.params.room;
                    return getDeviceTypeInRoom(vm.roomId);
                } else {
                    vm.selectRoom = true;
                    getRooms();
                }
            });
        waitForNewValue();
      }

      function selectRoomId(id){
        boxService.update(vm.boxId, {params: {room: id}})
            .then(function(data) {
                vm.selectRoom = false;
                vm.roomId = id;
                return getDeviceTypeInRoom(vm.roomId);
            });
      }

      function getRooms(){
          return roomService.get()
            .then(function(data){
                vm.rooms = data.data;
                vm.rooms.unshift({id: null, name: '----'});
            });
      }

      function getDeviceTypeInRoom(id){
          deviceService.getDeviceTypeInRoom(id)
            .then(function(data){
                vm.room = data.data;
            });
      }

      function changeValue(deviceType, value){
        return deviceService.exec(deviceType, value)
          .then(function(data){
             deviceType.lastValue = data.data.value; 
          });
    }
      
      // waiting for websocket message
      function waitForNewValue() {
  
        io.socket.on('newDeviceState', function(deviceState) {
          updateValueType(deviceState);
          updateRoomView(deviceState);
        });

      }
  
      function updateRoomView(newDeviceState) {
        vm.room.deviceTypes.forEach(function(type) {
            if (type.id === newDeviceState.devicetype) {
            type.lastValue = newDeviceState.value;
            type.lastChanged = newDeviceState.datetime;
            $scope.$apply();
            }
        });
      }
  
  
      // loop foreach device and upadte the value when the type is found
      function updateValueType(deviceState) {
        var found = false;
        var i = 0;
        if (vm.room.deviceTypes) {
          while (!found && i < vm.room.deviceTypes.length) {
  
            if (vm.room.deviceTypes[i].id == deviceState.devicetype) {
              found = true;
              vm.room.deviceTypes[i].lastValue = deviceState.value;
              vm.room.deviceTypes[i].lastChanged = deviceState.datetime;
              $scope.$apply();
            }
            i++;
          }
        }
      }
      
    }
  })();
  