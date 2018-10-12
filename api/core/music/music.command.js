
module.exports = function command(scope) {

  var params = {};

  if(scope.deviceTypes && scope.deviceTypes.length) {
    params.devicetype = scope.deviceTypes[0].id; 
  } else if(scope.rooms && scope.rooms.length) {
    params.room = scope.rooms[0].id; 
  }

  var calledFunc;

  var response = {
    label: ''
  };

  switch(scope.label) {
  case 'flush-queue':
    response.label = 'music-queue-flushed';
    calledFunc = gladys.music.flushQueue(params)
      .then(() => response);
    break;

  case 'get-current-track':
    response.label = 'tell-music-current-track';
    calledFunc = gladys.music.getCurrentTrack(params)
      .then(() => response);
    break;

  case 'next':
    response.label = 'music-next';
    calledFunc = gladys.music.next(params)
      .then(() => response);
    break;

  case 'pause':
    response.label = 'music-paused';
    calledFunc = gladys.music.pause(params)
      .then(() => response);
    break;

  case 'play':
    response.label = 'music-played';
    calledFunc = gladys.music.play(params)
      .then(() => response);
    break;

  case 'previous':
    response.label = 'music-previous';
    calledFunc = gladys.music.previous(params)
      .then(() => response);
    break;

  case 'volume-up':
    response.label = 'music-volume-set-up';
    calledFunc = gladys.music.getVolume(params)
      .then((result) => {
                    
        // increase the volume from 15%
        var newVolume = Math.floor(result.volume * 1.15);
        params.volume = newVolume;
        return gladys.music.setVolume(params);
      })
      .then(() => response);
    break;

  case 'volume-down':
    response.label = 'music-volume-set-down';
    calledFunc = gladys.music.getVolume(params)
      .then((result) => {
                    
        // decrease the volume from 15%
        var newVolume = Math.floor(result.volume * 0.75);
        params.volume = newVolume;
        return gladys.music.setVolume(params);
      })
      .then(() => response);
    break;

  case 'stop':
    response.label = 'music-stopped';
    calledFunc = gladys.music.stop(params)
      .then(() => response);
    break;  

  default:
    calledFunc = Promise.reject(new Error('UNKNOWN_COMMAND'));
    break;
  }

  return calledFunc;
};