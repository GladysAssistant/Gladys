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
      openSource: openSource,
      openMenu: openMenu,
      rec: rec,
      customCommand: customCommand,
      programPlus: programPlus,
      programMinus: programMinus,
      openInfo: openInfo,
      programVod: programVod
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
      return $http({method: 'POST', url: '/television/state', data: params});
    }

    function getState(params) {
      return $http({method: 'GET', url: '/television/' + params.device + '/state'});
    }

    function setChannel(params) {
      return $http({method: 'POST', url: '/television/channel', data: params});
    }

    function getChannel(params) {
      return $http({method: 'GET', url: '/television/' + params.device + '/channel'});
    }

    function setMuted(params) {
      return $http({method: 'POST', url: '/television/mute', data: params});
    }

    function volumeUp(params) {
      return $http({method: 'POST', url: '/television/volume/up', data: params});
    }

    function volumeDown(params) {
      return $http({method: 'POST', url: '/television/volume/down', data: params});
    }

    function pressKey(params) {
      return $http({method: 'POST', url: '/television/presskey', data: params});
    }

    function getSources(params) {
      return $http({method: 'GET', url: '/television/' + params.device + '/source'});
    }

    function openSource(params) {
      return $http({method: 'POST', url: '/television/opensource', data: params});
    }

    function openMenu(params) {
      return $http({method: 'POST', url: '/television/openmenu', data: params});
    }

    function rec(params) {
      return $http({method: 'POST', url: '/television/rec', data: params});
    }

    function getMuted(params) {
      return $http({method: 'GET', url: '/television/' + params.device + '/mute'});
    }

    function customCommand(params) {
      return $http({method: 'POST', url: '/television/customcommand', data: params});
    }
                      
    function programPlus(params) {
      return $http({method: 'POST', url: '/television/programPlus', data: params});
    }
          
    function programMinus(params) {
      return $http({method: 'POST', url: '/television/programMinus', data: params});
    }

    function openInfo(params) {
      return $http({method: 'POST', url: '/television/openInfo', data: params});
    }
              
    function programVod(params) {
      return $http({method: 'POST', url: '/television/programVod', data: params});
    }
  }
})();
