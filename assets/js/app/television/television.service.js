(function () {
    'use strict';

    angular
        .module('gladys')
        .factory('televisionService', televisionService);

    televisionService.$inject = ['$http', 'cacheService'];

    function televisionService($http, cacheService) {
        
        var service = {
            play: play,
            pause: pause,
            stop: stop,
            rewind: rewind,
            fastForward: fastForward,
            switchState: switchState,
            getState: getState,
            setChannel: setChannel,
            getChannel: getChannel,
            setMuted: setMuted,
            getMuted: getMuted,
            volumeUp: volumeUp,
            volumeDown: volumeDown,
            pressKey: pressKey,
            getSources: getSources,
            openSources: openSources,
            openMenu: openMenu,
            rec: rec,
            customCommand: customCommand,
        };

        return service;

        function play(params) {
            return $http({method: 'POST', url: '/television/play', data: params});
        }

        function pause(params) {
            return $http({method: 'POST', url: '/television/pause', data: params});
        }

        function stop(params) {
            return $http({method: 'POST', url: '/television/stop', data: params});
        }

        function rewind(params) {
            return $http({method: 'POST', url: '/television/rewind', data: params});
        }

        function fastForward(params) {
            return $http({method: 'POST', url: '/television/fastforward', data: params});
        }

        function switchState(params) {
            return $http({method: 'POST', url: '/television/'+params.device+'/state', data: params});
        }

        function getState(params) {
            return $http({method: 'GET', url: '/television/state', params: params});
        }

        function setChannel(params) {
            return $http({method: 'POST', url: '/television/'+params.device+'/channel', data: params});
        }

        function getChannel(params) {
            return $http({method: 'GET', url: '/television/channel', params: params});
        }

        function setMuted(params) {
            return $http({method: 'POST', url: '/television/'+params.device+'/mute', data: params})
        }

        function volumeUp(params) {
            return $http({method: 'POST', url: '/television/volume/up', data: params})
        }

        function volumeDown(params) {
            return $http({method: 'POST', url: '/television/volume/down', data: params})
        }

        function pressKey(params) {
            return $http({method: 'POST', url: '/television/presskey', data: params})
        }

        function getSources(params) {
            return $http({method: 'GET', url: '/television/source', params: params});
        }

        function openSources(params) {
            return $http({method: 'POST', url: '/television/opensource', data: params});
        }

        function openMenu(params) {
            return $http({method: 'POST', url: '/television/openmenu', data: params});
        }

        function rec(params) {
            return $http({method: 'POST', url: '/television/rec', data: params});
        }

        function getMuted(params) {
            return $http({method: 'GET', url: '/television/mute', params: params})
        }

        function customCommand(params) {
            return $http({method: 'POST', url: '/television/customcommand', data: params});
        }
    }
})();