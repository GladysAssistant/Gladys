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
        .controller('LifeEventCtrl', LifeEventCtrl);

    LifeEventCtrl.$inject = ['lifeeventService', 'calendarService'];

    function LifeEventCtrl(lifeeventService, calendarService) {
        /* jshint validthis: true */
        var vm = this;
    	vm.lifeevents = [];
        vm.addMoreLifeEvents = addMoreLifeEvents;
        vm.startValue = 0;
        vm.nbElementToGet = 10;
        vm.remoteIsBusy = false;
        vm.noMoreLifeEvents = false;
        vm.nextEvents = [];
        vm.now = new Date();
        activate();

        function activate() {
            addMoreLifeEvents();
            getNextEvents();
            return ;
        }
        
        function addMoreLifeEvents(){
            if(!vm.remoteIsBusy && !vm.noMoreLifeEvents){
                getLifeEvents(vm.startValue,vm.startValue+vm.nbElementToGet);
                vm.startValue += vm.nbElementToGet; 
            }
        }

        function getLifeEvents(start, end) {
            vm.remoteIsBusy = true;
            return lifeeventService.getLifeEvents(start, end)
                .then(function(data){
                    if(data.data.length == 0){
                        vm.noMoreLifeEvents = true;
                    }
                    vm.lifeevents = vm.lifeevents.concat(data.data);
                    vm.remoteIsBusy = false;
                });
        }
        
        function getNextEvents() {
            return calendarService.getNextEvents()
                .then(function(data){
                    vm.nextEvents = data.data;
                });
        }
    }
})();
