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
            updateDeviceType: updateDeviceType,
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
            return $http({method: 'POST', url: '/television/fastForward', data: params});
        }

        function switchState(params) {
            return $http({method: 'POST', url: '/television/switchState', data: params});
        }

        function getState(params) {
            return $http({method: 'GET', url: '/television/getState', params: params});
        }

        function setChannel(params) {
            return $http({method: 'POST', url: '/television/setChannel', data: params});
        }

        function setMuted(params) {
            return $http({method: 'POST', url: '/television/setMuted', data: params})
        }

        function volumeUp(params) {
            return $http({method: 'POST', url: '/television/volumeUp', data: params})
        }

        function volumeDown(params) {
            return $http({method: 'POST', url: '/television/volumeDown', data: params})
        }

        function pressKey(params) {
            return $http({method: 'POST', url: '/television/pressKey', data: params})
        }

        function getSources(params) {
            return $http({method: 'GET', url: '/television/getSources', params: params});
        }

        function openSources(params) {
            return $http({method: 'POST', url: '/television/openSources', data: params});
        }

        function openMenu(params) {
            return $http({method: 'POST', url: '/television/openMenu', data: params});
        }

        function rec(params) {
            return $http({method: 'POST', url: '/television/rec', data: params});
        }

        function getMuted(params) {
            return $http({method: 'GET', url: '/television/getMuted', params: params})
        }

        function customCommand(params) {
            return $http({method: 'POST', url: '/television/customCommand', data: params});
        }

        function updateDeviceType(params) {
            return $http({method: 'POST', url: '/devicestate', data: params})
        } 
    }
})();