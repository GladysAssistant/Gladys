var request = require('supertest');
var validateParamUser = require('../../validator/paramUserValidator.js');

describe('ParamUser', function() {

  describe('create', function() {
    
    it('should create a paramUser', function (done) {
        
        var param = {
            name:'THIS_IS_A_TEST',
            value: 'value'
        };
        
     	request(sails.hooks.http.app)
        .post('/paramuser?token=test')
        .send(param)
        .expect(201)
        .end(function(err, res) {
            if(err) return done(err);
            
            validateParamUser(res.body);
            done();
        });

    });
    
  });


});