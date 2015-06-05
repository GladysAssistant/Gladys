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
    .module('app')
    .controller('roomCtrl', roomCtrl);

  roomCtrl.$inject = ['roomService', 'houseService', 'userService'];

  function roomCtrl(roomService, houseService, userService) {
    /* jshint validthis: true */
    var vm = this;
    vm.addRelation = addRelation;
    vm.defineSleepIn = defineSleepIn;
    vm.getRooms = getRooms;
    vm.getRelationTypes = getRelationTypes;
    vm.getRelations = getRelations;
    vm.getSleepin = getSleepin;
    vm.destroyRelation = destroyRelation;
    vm.destroySleepin = destroySleepin;
    vm.newSleepIn = {};
    vm.newRelation = {};
    vm.rooms = [];
    vm.users = [];
    vm.houses = [];
    vm.sleepIn = []; 
    vm.userHouseRelations = []; 
    vm.userHouseRelationTypes = [];

    activate();

    function activate() {
      getUsers();
      getRooms();
      getRelationTypes();
      getHouses();
      getSleepin();
      getRelations();
      return ;
    }

    function addRelation() {
      return roomService.addRelation(vm.newRelation)
        .then(function(data){
          
          // refresh the relations
          getRelations();
        });
    }

    function defineSleepIn() {
      return roomService.defineSleepIn(vm.newSleepIn)
        .then(function(data){
          
          // refresh the room sleep in
          getSleepin();
        });
    }

    function getHouses() {
      return houseService.getHouses()
        .then(function(data){
          
          vm.houses = data.data;
          if(vm.houses.length > 0){
            vm.newRelation.house = vm.houses[0].id;
          }
        });
    }

    function getRooms() {
      return roomService.getRooms()
        .then(function(data){
          
          vm.rooms = data.data;
          if(vm.rooms.length > 0){
            vm.newSleepIn.room = vm.rooms[0].id;
          }
        });
    }

    function getRelationTypes() {
      return roomService.getRelationTypes()
        .then(function(data){
          
          vm.userHouseRelationTypes = data.data;
          if(vm.userHouseRelationTypes.length > 0){
            vm.newRelation.relation = vm.userHouseRelationTypes[0].id;
          }
        });
    }

    function getRelations() {
      return roomService.getRelations()
        .then(function(data){
          
          vm.userHouseRelations = data.data;
        });
    }

    function getSleepin() {
      return roomService.getSleepin()
        .then(function(data){
          
          vm.sleepIn = data.data;
        });
    }

    function getUsers() {
      return userService.getUsers()
        .then(function(data){
          
          vm.users = data.data;
          if(vm.users.length > 0){
            vm.newSleepIn.user = vm.users[0].id;
            vm.newRelation.user = vm.users[0].id;
          }
        });
    }

    function destroyRelation(index, id) {
      return roomService.destroyRelation(id)
        .then(function(data){
          
          vm.userHouseRelations.splice(index, 1);
        });
    }

    function destroySleepin(index, roomId, userId) {
      return roomService.destroySleepin(roomId, userId)
        .then(function(data){
          vm.sleepIn.splice(index, 1);
        });
    }

  }
})();