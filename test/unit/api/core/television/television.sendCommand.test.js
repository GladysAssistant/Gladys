var should = require('should');

describe('Television', function() {

  describe('sendCommand', function() {
    
    it('should call switchState function to test module by device ID', function (done) {
     	  
          gladys.television.switchState({device: 5, state: true})
                .then(function(){
                    
                    done();
                }).catch(done);
    });

    it('should call switchState function to test module by room ID', function (done) {
     	  
          gladys.television.switchState({room: 1, state: true})
                .then(function(){
                    
                    done();
                }).catch(done);
    });

    /**
     * Test all available functions
     */
    
    var functionsAvailable = [
        'getState',
        'setChannel',
        'getChannel',
        'pause',
        'play',
        'stop',
        'fastForward',
        'rewind',
        'setMuted',
        'setVolume',
        'getVolume',
        'volumeUp',
        'volumeDown',
        'pressKey',
        'getSources',
        'openSource',
        'openMenu',
        'rec',
        'customCommand'
    ];

    functionsAvailable.forEach(function(func){
        
        it(`should call ${func} function`, function (done) {

            switch (func) {
                case 'setChannel':
                    options = {device: 5, channel: 1}
                break;

                case 'pause':
                    options = {device: 5, controlType: func}
                break;

                case 'play':
                    options = {device: 5, controlType: func}
                break;

                case 'stop':
                    options = {device: 5, controlType: func}
                break;

                case 'fastForward':
                    options = {device: 5, controlType: func}
                break;

                case 'rewind':
                    options = {device: 5, controlType: func}
                break;

                case 'setMuted':
                    options = {device: 5, mute: true}
                break;

                case 'setVolume':
                    options = {device: 5, volume: 45}
                break;

                case 'pressKey':
                    options = {device: 5, key: 'up'}
                break;

                case 'openSource':
                    options = {device: 5, id: 'TV'}
                break;

                case 'customCommand':
                    options = {device: 5, color: 'yellow'}
                break;

                default :
                    options = {device: 5}
            }
            
              gladys.television[func](options)
                    .then(function(){
                        
                        done();
                    }).catch(done);
        });
    }); 
    
  });

});