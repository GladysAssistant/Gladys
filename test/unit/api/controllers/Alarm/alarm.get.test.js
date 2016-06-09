var request = require('supertest');
var validateAlarm = require('../../validator/alarmValidator.js');

describe('Alarm', function() {

  describe('get', function() {
    
    it('should a valid list of alarm', function (done) {
        
     	request(sails.hooks.http.app)
        .get('/alarm?token=test')
        .expect(200)
        .end(function(err, res) {
            if(err) return done(err);

            res.body.should.be.instanceOf(Array);
            res.body.length.should.not.equal(0);
            validateAlarm(res.body);
            done();
        });

    });
    
  });


});