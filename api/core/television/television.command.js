
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
  case 'television-set-channel':
    response.label = 'tell-television-set-channel';
    calledFunc = gladys.television.getCurrentChannel(params)
      .then((result) => {
        if(result !== params.channel) {
          return gladys.television.setChannel(params);
        }
      })
      .then(() => response);
    break;

  case 'television-switch-state':
    response.label = 'television-switch-state';
    calledFunc = gladys.television.getState(params)
      .then((result) => {
        if(result !== params.state) {
          return gladys.television.switchState(params);
        }
      })
      .then(() => response);
    break;

  case 'television-pause':
    response.label = 'television-paused';
    calledFunc = gladys.television.pause(params)
      .then(() => response);
    break;

  case 'television-play':
    response.label = 'television-played';
    calledFunc = gladys.television.play(params)
      .then(() => response);
    break;

  case 'television-rewind':
    response.label = 'television-rewind';
    calledFunc = gladys.television.rewind(params)
      .then(() => response);
    break;

  case 'television-fast-forward':
    response.label = 'television-fast-forward';
    calledFunc = gladys.television.fastForward(params)
      .then(() => response);
    break;

  case 'television-program-plus':
    response.label = 'television-program-next';
    calledFunc = gladys.television.programPlus(params)
      .then(() => response);
    break;

  case 'television-program-minus':
    response.label = 'television-program-previous';
    calledFunc = gladys.television.programMinus(params)
      .then(() => response);
    break;

  case 'television-volume-up':
    response.label = 'television-change-volume';
    calledFunc = gladys.television.volumeUp(params)
      .then(() => response);
    break;

  case 'television-volume-down':
    response.label = 'television-change-volume';
    calledFunc = gladys.television.volumeDown(params)
      .then(() => response);
    break;

  case 'television-stop':
    response.label = 'television-stopped';
    calledFunc = gladys.television.stop(params)
      .then(() => response);
    break; 
        
  case 'television-mute':
    response.label = 'television-mute';
    calledFunc = gladys.television.setMuted(params)
      .then(() => response);
    break;

  case 'television-open-info':
    response.label = 'television-open-info';
    calledFunc = gladys.television.openInfo(params)
      .then(() => response);
    break; 

  case 'television-program-vod':
    response.label = 'television-program-vod';
    calledFunc = gladys.television.programVod(params)
      .then(() => response);
    break; 

  default:
    calledFunc = Promise.reject(new Error('UNKNOWN_COMMAND'));
    break;
  }

  return calledFunc;
};
