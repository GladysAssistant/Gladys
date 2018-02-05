var should = require('should');

describe('Brain', function() {

  describe('classify', function() {
    
    it('should classify a sentence and call a service', function (done) {

        var user = {
          id: 1,
          language: 'en',
          password: 'KJKLJSDKLFJKLSDJFL'
        };
        
        var message = {
          text:'THIS IS A TEST, ARE YOU GETTING ME ???'
        }; 
     	
        gladys.brain.trainNew()
            .then(function(){
              return gladys.brain.classify(user, message);   
            })
           .then(function(result){
                result.should.be.instanceOf(Array);
                result.forEach(function(item){
                    item.should.have.property('message');
                    item.should.have.property('response');
                    item.message.should.have.property('label');
                    item.message.should.have.property('scope');
                    item.message.scope.should.have.property('user');
                    item.message.scope.user.should.not.have.property('password');
                    item.response.should.have.property('label');
                    item.response.should.have.property('text');
                    item.response.should.have.property('scope');
                });
                done();
            })
            .catch(function(err){
                done(err);
            });

    });
  
  });

});