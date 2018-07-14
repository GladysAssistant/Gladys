
(function () {
    'use strict';

    angular
        .module('gladys')
        .controller('MusicCtrl', MusicCtrl);

    MusicCtrl.$inject = ['musicService', 'roomService'];

    function MusicCtrl(musicService, roomService) {
        /* jshint validthis: true */
        var vm = this;
        vm.roomId = null;
        vm.displayAskRoomForm = false;

        vm.selectRoomId = selectRoomId;

        vm.play = play;
        vm.pause = pause;
        vm.stop = stop;
        vm.previous = previous;
        vm.next = next;
        vm.getCurrentTrack = getCurrentTrack;
        vm.getQueue = getQueue;

        vm.init = init;

        function activate(){
            getRoomId();
            if(vm.displayAskRoomForm) getRooms();
            else refreshMusicData();
        }

        function init(boxId){
            vm.boxId = boxId;
            activate();
        }
        
        function getRoomId() {
            vm.roomId =  musicService.getSavedRoomBox(vm.boxId);
            if(vm.roomId) vm.displayAskRoomForm = false;
            else vm.displayAskRoomForm = true;
        }

        function getRooms(){
            roomService.get()
              .then(function(data){
                  vm.rooms = data.data;
              });
        }

        function selectRoomId(roomId){
            musicService.saveRoomBox(vm.boxId, roomId);
            vm.displayAskRoomForm = false;
            vm.roomId = roomId;
            refreshMusicData();
        }

        function refreshMusicData(){
            getPlaying();
            getCurrentTrack();
            getQueue();
        }

        function play(){
            return musicService.play({room: vm.roomId})
                .then(function(){
                    vm.playing = true;
                });
        }

        function pause(){
            return musicService.pause({room: vm.roomId})
                .then(function(){
                    vm.playing = false;
                });
        }

        function stop(){
            return musicService.stop({room: vm.roomId})
                .then(function(){
                    vm.playing = false;
                    refreshMusicData();
                });
        }

        function previous(){
            return musicService.previous({room: vm.roomId})
                .then(function(){
                    getCurrentTrack();
                    getQueue();
                });
        }

        function next(){
            return musicService.next({room: vm.roomId})
                .then(function(){
                    getCurrentTrack();
                    getQueue();
                });
        }

        function getPlaying(){
            return musicService.getPlaying({room: vm.roomId})
                .then(function(data){
                    vm.playing = data.data.playing;
                });
        }

        function getCurrentTrack(){
            return musicService.getCurrentTrack({room: vm.roomId})
                .then(function(data){
                    vm.currentTrack = data.data;
                });
        }

        function getQueue() {
            return musicService.getQueue({room: vm.roomId})
                .then(function(data){
                    vm.queue = data.data;
                });
        }

    }
})();
