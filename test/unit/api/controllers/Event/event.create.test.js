var request = require('supertest');
var validateEvent = require('../../validator/eventValidator.js');

describe('Event', function() {

  describe('create', function() {
    
    it('should create an event', function (done) {
        
        var obj = {
           code: 'test' 
        };
        
     	request(sails.hooks.http.app)
        .post('/event?token=test')
        .send(obj)
        .expect(201)
        .end(function(err, res) {
            if(err) return done(err);
            
            validateEvent(res.body);
            done();
        });

    });
    
    it('should create an event in GET request', function (done) {
        
     	request(sails.hooks.http.app)
        .get('/event/create?token=test&code=test')
        .expect(201)
        .end(function(err, res) {
            if(err) return done(err);
            
            validateEvent(res.body);
            done();
        });

    });
    
  });


});