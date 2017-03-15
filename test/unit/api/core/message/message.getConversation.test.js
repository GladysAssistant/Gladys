var should = require('should');
var validateMessage = require('../../validator/messageValidator.js');

describe('Message', function() {

  describe('getConversation', function() {
    
    it('should get list of messages', function (done) {
          
          gladys.message.getConversation('05e81660-3998-4574-be8e-82c0c722b8fa')
                .then(function(result){
                    result.should.be.instanceOf(Array);
                    result.length.should.equal(3);
                    validateMessage(result);
                    done();
                }).catch(done);
    });
    
  });

});