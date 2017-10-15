var request = require('supertest');

describe('ScenarioController', function() {

  describe('export', function() {
    
    it('should export a scenario', function (done) {

     	request(sails.hooks.http.app)
        .post('/scenario/1/export?token=test')
        .expect(200)
        .end(function(err, res) {
            if(err) return done(err);
            
            res.body.should.have.property('trigger');
            res.body.should.have.property('conditions');
            res.body.should.have.property('actions');
            done();
        });

    });
    
  });


});