var request = require('supertest');
var validateAlarm = require('../../validator/alarmValidator.js');

describe('Alarm', function() {

  describe('create', function() {
    
    it('should create an alarm', function (done) {
        
         var alarm = {
            datetime: new Date().toString(),
            user: 1,
            name: 'test'  
          };
        
     	request(sails.hooks.http.app)
        .post('/alarm?token=test')
        .send(alarm)
        .expect(201)
        .end(function(err, res) {
            if(err) return done(err);

            validateAlarm(res.body);
            done();
        });

    });
    
  });


});