var request = require('supertest');
var validateAlarm = require('../../validator/alarmValidator.js');

describe('Alarm', function() {

  describe('delete', function() {
    
    it('should delete an alarm', function (done) {
        
        
     	request(sails.hooks.http.app)
        .delete('/alarm/1?token=test')
        .expect(200)
        .end(function(err, res) {
            if(err) return done(err);

            done();
        });

    });
    
  });


});