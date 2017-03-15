var should = require('should');
var validateMessage = require('../../validator/messageValidator.js');

describe('Message', function() {

  describe('send', function() {
    
    it('should send a message to gladys', function (done) {
          
          gladys.message.send({id: 1, language: 'en'}, {text: 'What time is it ?'})
                .then(function(result){
                    result.should.have.property('message');
                    result.should.have.property('responses');
                    result.responses.should.be.instanceOf(Array);
                    result.responses.forEach(function(response) {
                        response.should.have.property('label');
                    });
                    done();
                }).catch(done);
    });
    
  });

});