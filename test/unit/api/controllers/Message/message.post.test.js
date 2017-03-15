var request = require('supertest');

describe('MessageController', function() {

  describe('POST /message', function() {
    
    it('should send a message', function (done) {
 
     	request(sails.hooks.http.app)
        .post('/message?token=test')
        .send({text: 'Hi'})
        .expect(200)
        .end(function(err, res) {
            if(err) return done(err);
            
            res.body.should.have.property('message');
            res.body.should.have.property('responses');
            res.body.responses.should.be.instanceOf(Array);

            done();
        });

    });
    
  });


});