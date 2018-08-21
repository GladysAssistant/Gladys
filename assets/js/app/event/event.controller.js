
(function () {
    'use strict';

    angular
        .module('gladys')
        .controller('EventCtrl', EventCtrl);

    EventCtrl.$inject = ['eventService'];

    function EventCtrl(eventService) {
        /* jshint validthis: true */
        var vm = this;
    	vm.events = [];
        vm.loadMore = loadMore;
        vm.startValue = 0;
        vm.nbElementToGet = 20;
        vm.remoteIsBusy = false;
        vm.noMoreEvents = false;
        vm.nextEvents = [];
        vm.now = new Date();
        activate();

        function activate() {
            loadMore();
            waitForNewEvent()
            return ;
        }
        
        function loadMore(){
            if(!vm.remoteIsBusy && !vm.noMoreEvents){
                get(vm.startValue+vm.nbElementToGet, vm.startValue);
                vm.startValue += vm.nbElementToGet; 
            }
        }

        function get(take, skip) {
            vm.remoteIsBusy = true;
            return eventService.get(take, skip)
                .then(function(data){
                    if(data.data.length === 0){
                        vm.noMoreEvents = true;
                    }
                    vm.events = vm.events.concat(data.data);
                    vm.remoteIsBusy = false;
                });
        }

        // waiting for websocket message
        function waitForNewEvent() {
            io.socket.on('newEvent', function (event) {
                vm.events.unshift(event);
            });
        }
        
    }
})();
