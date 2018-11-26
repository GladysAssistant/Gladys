  
(function () {
    'use strict';

    angular
        .module('gladys')
        .controller('HouseCtrl', HouseCtrl);

    HouseCtrl.$inject = ['houseService', 'roomService', 'notificationService'];

    function HouseCtrl(houseService, roomService, notificationService) {
        /* jshint validthis: true */
        var vm = this;

        vm.createHouse = createHouse;
        vm.createRoom = createRoom;
        vm.deleteHouse = deleteHouse;
        vm.deleteRoom = deleteRoom;
        vm.getHouses = getHouses;
        vm.getRooms = getRooms;
        vm.newHouse = {};
        vm.newRoom = {};
        vm.updateRoom = updateRoom;
        vm.updateHouse = updateHouse;
        
        vm.houses = [];
        vm.rooms = [];

        vm.savingHouse = false;
        vm.savingRoom = false;

        activate();

        function activate() {
            getHouses();
            getRooms();
            return ;
        }

        function createHouse(house) {
            return houseService.create(house)
                .then(function(data){
                    getHouses();
                    resetNewHouseFields();
                })
                .catch(function(err){
                    if(err.data && err.data.code && err.data.code == 'E_VALIDATION') {
                        for(var key in err.data.invalidAttributes){
                            if(err.data.invalidAttributes.hasOwnProperty(key)){
                                notificationService.errorNotificationTranslated('HOUSE.INVALID_' + key.toUpperCase());
                            }
                        }
                    } else {
                        notificationService.errorNotificationTranslated('DEFAULT.ERROR');
                    }
                });
        }

        function createRoom(room) {
            return roomService.create(room)
                .then(function(data){
                    getRooms();
                    resetNewRoomFields();
                })
                .catch(function(err) {
                    if(err.data && err.data.code && err.data.code == 'E_VALIDATION') {
                        for(var key in err.data.invalidAttributes){
                            if(err.data.invalidAttributes.hasOwnProperty(key)){
                                notificationService.errorNotificationTranslated('ROOM.INVALID_' + key.toUpperCase());
                            }
                        }
                    } else {
                        notificationService.errorNotificationTranslated('DEFAULT.ERROR');
                    }
                });
        }

        function updateHouse(house) {
          vm.savingHouse = true;
          return houseService.update(house.id, house)
            .then(function(){
              vm.savingHouse = false;
            })
            .catch(function(err) {
              vm.savingHouse = false;
            });
        }

        function updateRoom(room) {
          vm.savingRoom = true;
          return roomService.update(room.id, room)
            .then(function(){
              vm.savingRoom = false;
            })
            .catch(function(err) {
              vm.savingRoom = false;
            });
        }

        function deleteHouse(index, id) {
            return houseService.destroy(id)
                .then(function(data){
                    
                    // deleting House from houses array
                    vm.houses.splice(index, 1);
                });
        }

        function deleteRoom(index, id) {
            return roomService.destroy(id)
                .then(function(data){
                    
                    // deleting room from rooms array
                    vm.rooms.splice(index, 1);
                });
        }

        function getHouses() {
            return houseService.get({take: 10000})
                .then(function(data){
                    vm.houses = data.data;
                });
        }

        function getRooms() {
            return roomService.get({take: 10000})
                .then(function(data){
                    vm.rooms = data.data;
                });
        }

        function resetNewHouseFields() {
            vm.newHouse = {};
        }

        function resetNewRoomFields() {
            vm.newRoom = {};
        }
    }
})();
