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
        .controller('HouseCtrl', HouseCtrl);

    HouseCtrl.$inject = ['houseService', 'roomService'];

    function HouseCtrl(houseService, roomService) {
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
        
        vm.houses = [];
        vm.rooms = [];

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
                });
        }

        function createRoom(room) {
            return roomService.create(room)
                .then(function(data){
                    getRooms();
                    resetNewRoomFields();
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

        function getHouses(options) {
            return houseService.get(options)
                .then(function(data){
                    vm.houses = data.data;
                });
        }

        function getRooms(options) {
            return roomService.get(options)
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
