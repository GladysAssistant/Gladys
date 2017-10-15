var should = require('should');
var validateAction = require('../../validator/actionValidator.js');

describe('Scenario', function() {

  describe('import', function() {
    
    it('should import a scenario', function (done) {
          
        var scenario = {
            "trigger":  {
                "title": "test",
                "condition_template": "true",
                "active":1,
                "code":"test",
                "user":1
            },
            "conditions": [
                {
                    "code":"test.exec",
                    "condition_template": "temperature > 12",
                    "params": {
                        "test":"test"
                    }
                }
            ],
            "actions": [
                {
                    "code":"test.exec",
                    "params":{
                        "houseId":"1",
                        "userId":"1"
                    }
                }
            ]
        };
        
        gladys.scenario.import(scenario)
            .then(function(result){

                result.should.have.property('trigger');
                result.should.have.property('conditions');
                result.should.have.property('actions');
                validateAction(result.actions);
                done();
            })
            .catch(done);
    });
    
  });

});