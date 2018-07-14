  
(function () {
    'use strict';

    angular
        .module('gladys')
        .factory('musicService', musicService);

    musicService.$inject = ['$http', 'cacheService'];

    function musicService($http, cacheService) {
        
        var service = {
            play: play,
            pause: pause,
            stop: stop,
            previous: previous,
            next: next,
            getPlaying: getPlaying,
            getCurrentTrack: getCurrentTrack,
            getQueue: getQueue,
            getSavedRoomBox: getSavedRoomBox,
            saveRoomBox: saveRoomBox
        };

        var EXPIRATION = 10*365*24*3600*1000;

        return service;

        function play(params) {
            return $http({method: 'POST', url: '/music/play', data: params});
        }

        function pause(params) {
            return $http({method: 'POST', url: '/music/pause', data: params});
        }

        function stop(params) {
            return $http({method: 'POST', url: '/music/stop', data: params});
        }

        function previous(params) {
            return $http({method: 'POST', url: '/music/previous', data: params});
        }

        function next(params) {
            return $http({method: 'POST', url: '/music/next', data: params});
        }

        function getPlaying(params) {
            return $http({method: 'GET', url: '/music/playing', params: params});
        }

        function getCurrentTrack(params) {
            return $http({method: 'GET', url: '/music/currenttrack', params: params});
        }

        function getQueue(params) {
            return $http({method: 'GET', url: '/music/queue', params: params});
        }

        // get RoomId from localStorage
        function getSavedRoomBox(boxId){
            return cacheService.get('MUSIC_BOX_ID_' + boxId);
        }

        // saveRoomId of this box to localStorage
        function saveRoomBox(boxId, roomId){
            return cacheService.set('MUSIC_BOX_ID_' + boxId, roomId, EXPIRATION);
        }
    }
})();