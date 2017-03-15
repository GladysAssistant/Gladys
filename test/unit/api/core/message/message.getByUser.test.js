var should = require('should');
var validateMessage = require('../../validator/messageValidator.js');

describe('Message', function() {

  describe('getByUser', function() {
    
    it('should get message exchanged with gladys', function (done) {
          
          gladys.message.getByUser({id: 1}, {user: null, take: 3, skip: 0})
                .then(function(result){
                    result.should.be.instanceOf(Array);
                    result.length.should.equal(3);
                    validateMessage(result);
                    done();
                }).catch(done);
    });
    
  });

});