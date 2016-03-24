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

    HouseCtrl.$inject = ['houseService'];

    function HouseCtrl(houseService) {
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
        vm.relations = [];
        vm.rooms = [];

        activate();

        function activate() {
            getHouses();
            getRooms();
            return ;
        }

        function createHouse() {
            return houseService.createHouse(vm.newHouse)
                .then(function(data){
                    if(!data.data.error){
                        getHouses();
                        resetNewHouseFields();
                    }
                });
        }

        function createRoom() {
            return houseService.createRoom(vm.newRoom)
                .then(function(data){
                    if(!data.data.error){
                        getRooms();
                        resetNewRoomFields();
                    }
                });
        }

        function deleteHouse(index, id) {
            return houseService.deleteHouse(id)
                .then(function(data){
                    // deleting House from houses array
                    vm.relations.splice(index, 1);
                });
        }

        function deleteRoom(index, id) {
            return houseService.deleteRoom(id)
                .then(function(data){
                    // deleting room from rooms array
                    vm.rooms.splice(index, 1);
                });
        }

        function getHouses() {
            return houseService.getHouses()
                .then(function(data){
                    vm.relations = data.data;
                });
        }

        function getRooms() {
            return houseService.getRooms()
                .then(function(data){
                    vm.rooms = data.data;
                });
        }

        function resetNewHouseFields() {
            vm.newHouse.name = "";
            vm.newHouse.address = "";
            vm.newHouse.city = "";
            vm.newHouse.postcode = "";
            vm.newHouse.country = "";
        }

        function resetNewRoomFields() {
            vm.newRoom.name = "";
        }
    }
})();
