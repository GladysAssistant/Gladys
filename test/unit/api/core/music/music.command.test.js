var should = require('should');
var validateModule = require('../../validator/moduleValidator.js');

describe('Music', function() {

  describe('command', function() {

    var commands = [
        {
            command: 'play',
            answer: 'music-played'
        },
        {
            command: 'pause',
            answer: 'music-paused'
        },
        {
            command: 'flush-queue',
            answer: 'music-queue-flushed'
        },
        {
            command: 'get-current-track',
            answer: 'tell-music-current-track'
        },
        {
            command: 'next',
            answer: 'music-next'
        },
        {
            command: 'previous',
            answer: 'music-previous'
        },
        {
            command: 'volume-up',
            answer: 'music-volume-set-up'
        },
        {
            command: 'volume-down',
            answer: 'music-volume-set-down'
        },
        {
            command: 'stop',
            answer: 'music-stopped'
        }
    ];

    commands.forEach(function(command) {
        
        it(`should command music :${command.command} and answer ${command.answer}`, function (done) {
     	 
            var scope = {
                label: command.command
            };
            
            gladys.music.command(scope)
                    .then(function(result){
                        
                        result.should.have.property('label', command.answer);
                        done();
                    }).catch(done);
        });

    });
    
  });

});


