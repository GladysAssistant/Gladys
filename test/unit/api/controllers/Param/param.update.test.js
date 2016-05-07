var request = require('supertest');
var validateParam = require('../../validator/paramValidator.js');

describe('Param', function() {

  describe('update', function() {
    
    it('should update a param', function (done) {
        
        var param = {
            value: 'value'
        };
        
     	request(sails.hooks.http.app)
        .patch('/param/quote_of_the_day?token=test')
        .send(param)
        .expect(200)
        .end(function(err, res) {
            if(err) return done(err);
            
            validateParam(res.body);
            res.body.value.should.equal(param.value);
            done();
        });

    });
    
  });


});