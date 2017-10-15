var should = require('should');

describe('Scenario', function() {

  describe('export', function() {
    
    it('should export a scenario', function (done) {
          
          gladys.scenario.export(1)
                .then(function(result){
                    result.should.have.property('trigger');
                    result.should.have.property('conditions');
                    result.should.have.property('actions');
                    done();
                })
                .catch(done);
    });
    
  });

});