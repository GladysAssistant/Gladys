describe('Television', function() {
  describe('command', function() {
    var commands = [
      {
        command: 'television-set-channel',
        answer: 'tell-television-set-channel'
      },
      {
        command: 'television-switch-state',
        answer: 'television-switch-state'
      },
      {
        command: 'television-pause',
        answer: 'television-paused'
      },
      {
        command: 'television-play',
        answer: 'television-played'
      },
      {
        command: 'television-rewind',
        answer: 'television-rewind'
      },
      {
        command: 'television-fast-forward',
        answer: 'television-fast-forward'
      },
      {
        command: 'television-program-plus',
        answer: 'television-program-next'
      },
      {
        command: 'television-program-minus',
        answer: 'television-program-previous'
      },
      {
        command: 'television-volume-up',
        answer: 'television-change-volume'
      },
      {
        command: 'television-stop',
        answer: 'television-stopped'
      },
      {
        command: 'television-mute',
        answer: 'television-mute'
      },
      {
        command: 'television-program-vod',
        answer: 'television-program-vod'
      },
      {
        command: 'television-open-info',
        answer: 'television-open-info'
      }
    ];

    commands.forEach(function(command) {
      it(`should command television :${
        command.command
      } and answer ${command.answer}`, function(done) {
        var scope = {
          label: command.command
        };

        gladys.television
          .command(scope)
          .then(function(result) {
            result.should.have.property('label', command.answer);
            done();
          })
          .catch(done);
      });
    });
  });
});
