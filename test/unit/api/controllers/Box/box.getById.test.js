var request = require('supertest');
var validateBox = require('../../validator/boxValidator.js');

describe('Box', function() {

  describe('getById', function() {
    
    it('should get a box by id', function (done) {
        
     	request(sails.hooks.http.app)
        .get('/box/1?token=test')
        .expect(200)
        .end(function(err, res) {
            if(err) return done(err);

            res.body.should.be.instanceOf(Object);
            res.body.should.be.have.property('params');
            validateBox(res.body);
            done();
        });

    });
    
  });


});