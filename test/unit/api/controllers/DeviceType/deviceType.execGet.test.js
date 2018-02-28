var request = require('supertest');

describe('DeviceTypeController', function() {

  describe('execGet', function() {
    
    it('should execute a command in GET', function (done) {
        
     	request(sails.hooks.http.app)
        .get('/devicetype/1/exec?token=test&value=1')
        .expect(200)
        .end(function(err, res) {
            if(err) return done(err);

            res.body.should.have.property('devicetype');
            res.body.should.have.property('value', 1);
            res.body.should.have.property('datetime');
            
            done();
        });

    });
    
  });


});