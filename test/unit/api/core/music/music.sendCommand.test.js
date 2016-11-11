var should = require('should');

describe('Music', function() {

  describe('sendCommand', function() {
    
    it('should call play function to test module by devicetype ID', function (done) {
     	  
          gladys.music.play({devicetype: 4})
                .then(function(){
                    
                    done();
                }).catch(done);
    });

    it('should call play function to test module by room ID', function (done) {
     	  
          gladys.music.play({room: 1})
                .then(function(){
                    
                    done();
                }).catch(done);
    });

    /**
     * Test all available functions
     */

    var functionsAvailable = [
       'flushQueue',
       'getCurrentTrack',
       'getQueue',
       'getMuted',
       'getPlaylists',
       'getVolume',
       'next',
       'pause',
       'play',
       'playPlaylist',
       'previous',
       'queue',
       'setMuted',
       'setVolume',
       'stop'
    ];

    functionsAvailable.forEach(function(func){
        
        it(`should call ${func} function`, function (done) {
            
              gladys.music[func]({devicetype: 4})
                    .then(function(){
                        
                        done();
                    }).catch(done);
        });
    }); 
    
  });

});