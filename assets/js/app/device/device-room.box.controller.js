
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
      
    }
  })();
  