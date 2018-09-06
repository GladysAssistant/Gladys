
module.exports = function command(scope) {

    var params = {};

    if(scope.deviceTypes && scope.deviceTypes.length) params.devicetype = scope.deviceTypes[0].id;
    else if(scope.rooms && scope.rooms.length) params.room = scope.rooms[0].id;

    var calledFunc;

    var response = {
        label: ''
    };

    switch(scope.label) {
        case 'get-state':
            response.label = 'television-get-state';
            calledFunc = gladys.television.getState()
                .then(() => response)
        break;

        case 'get-current-channel':
            response.label = 'television-get-current-channel';
            calledFunc = gladys.television.getCurrentChannel()
                .then(() => response)
        break;

        case 'set-channel':
            response.label = 'tell-television-set-channel';
            calledFunc = gladys.television.getCurrentChannel()
                .then((result) => {
                    if(result !== params.channel) {
                        return gladys.television.setChannel(params.channel)
                    }
                })
        break;

        case 'switch-state':
            response.label = 'television-switch-state';
            calledFunc = gladys.television.getState()
                .then((result) => {
                    if(result !== params.state) {
                        return gladys.television.switchState(params.state)
                    }
                })
        break;

        case 'pause':
            response.label = 'television-paused';
            calledFunc = gladys.television.pause(params)
                .then(() => response);
        break;

        case 'play':
            response.label = 'television-played';
            calledFunc = gladys.television.play(params)
                .then(() => response);
        break;

        case 'previous':
            response.label = 'television-previous';
            calledFunc = gladys.television.previous(params)
                .then(() => response);
        break;

        case 'volume-up':
            response.label = 'television-volume-set-up';
            calledFunc = gladys.television.getVolume(params)
                .then((result) => {
                    
                    // increase the volume from 15%
                    var newVolume = Math.floor(result.volume * 1.15);
                    params.volume = newVolume;
                    return gladys.television.setVolume(params);
                })
                .then(() => response);
        break;

        case 'volume-down':
            response.label = 'television-volume-set-down';
            calledFunc = gladys.television.getVolume(params)
                .then((result) => {
                    
                    // decrease the volume from 15%
                    var newVolume = Math.floor(result.volume * 0.75);
                    params.volume = newVolume;
                    return gladys.television.setVolume(params);
                })
                .then(() => response);
        break;

        case 'stop':
            response.label = 'television-stopped';
            calledFunc = gladys.television.stop(params)
                .then(() => response);
        break;  

        default:
            calledFunc = Promise.reject(new Error('UNKNOWN_COMMAND'));
        break;
    }

    return calledFunc;
};