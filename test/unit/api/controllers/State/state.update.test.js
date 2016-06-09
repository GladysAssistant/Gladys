var request = require('supertest');
var validateState = require('../../validator/stateValidator.js');

describe('State', function() {

  describe('update', function() {
    
    it('should update a state', function (done) {
        
        var state = {
            state: 1, 
            launcher: 2
        };
        
     	request(sails.hooks.http.app)
        .patch('/state/1?token=test')
        .send(state)
        .expect(200)
        .end(function(err, res) {
            if(err) return done(err);

            validateState(res.body);
            res.body.launcher.should.equal(state.launcher);
            done();
        });

    });
    
  });


});