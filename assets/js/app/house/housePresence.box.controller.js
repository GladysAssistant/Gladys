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
        .controller('HousePresenceBoxCtrl', HousePresenceBoxCtrl);

    HousePresenceBoxCtrl.$inject = ['houseService', 'boxService'];

    function HousePresenceBoxCtrl(houseService, boxService) {
        /* jshint validthis: true */
        var vm = this;
        vm.init = init;
        vm.saveHouse = saveHouse;
        vm.enterHouse = null;
        vm.users = [];

        function init(id){
            vm.boxId = id;
            boxService.getById(id)
                .then(function(data) {
                    vm.box = data.data;
                    if(vm.box.params && vm.box.params.house) {
                        vm.enterHouse = false;
                        refreshUsers(vm.box.params.house);
                    } else {
                        displayHousePicker();
                    }
                });
        }

        function displayHousePicker(){
            houseService.get()
                .then(function(data){
                    vm.houses = data.data;
                    vm.enterHouse = true;
                });
        }

        function saveHouse(houseId){
            boxService.update(vm.box.id, {params: {house: houseId}})
                .then(function(data) {
                    vm.enterHouse = false
                    refreshUsers(houseId);
                });
        }

        function refreshUsers(houseId) {
            houseService.getUsers(houseId)
                .then(function(data) {
                    vm.users = data.data;
                });
        }

    }
})();
