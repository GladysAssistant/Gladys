var request = require('supertest');
var validateActionParam = require('../../validator/actionParamValidator.js');

describe('Action', function() {

  describe('addParam', function() {
    
    it('should addParam to an action', function (done) {
        
        var param = {
            value: 12,
            actiontypeparam: 1
        };
        
     	request(sails.hooks.http.app)
        .post('/action/1/param?token=test')
        .send(param)
        .expect(201)
        .end(function(err, res) {
            if(err) return done(err);
            
            validateActionParam(res.body);
            done();
        });

    });
    
  });


});