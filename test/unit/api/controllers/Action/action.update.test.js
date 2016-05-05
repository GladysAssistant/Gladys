var request = require('supertest');
var validateAction = require('../../validator/actionValidator.js');

describe('Action', function() {

  describe('update', function() {
    
    it('should update an action', function (done) {
        
        var action = {
            launcher: 2
        };
        
     	request(sails.hooks.http.app)
        .patch('/action/1?token=test')
        .send(action)
        .expect(200)
        .end(function(err, res) {
            if(err) return done(err);
            
            validateAction(res.body);
            res.body.launcher.should.equal(action.launcher);
            done();
        });

    });
    
  });


});