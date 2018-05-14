var request = require('supertest');

describe('DeviceTypeController', function() {

  describe('update', function() {
    
    it('should update a devicetype', function (done) {
        
     	request(sails.hooks.http.app)
        .patch('/devicetype/1?token=test')
        .send({name: 'toto'})
        .expect(200)
        .end(function(err, res) {
            if(err) return done(err);
            res.body.should.have.property('name', 'toto');
            
            done();
        });

    });

    it('should not update lastValue', function (done) {
        
      request(sails.hooks.http.app)
       .patch('/devicetype/1?token=test')
       .send({lastValue: 1000})
       .expect(200)
       .end(function(err, res) {
           if(err) return done(err);
           res.body.should.have.property('lastValue');
           should.equal(res.body.lastValue, null);
           
           done();
       });

   });
    
  });


});