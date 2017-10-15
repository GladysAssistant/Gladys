var should = require('should');
var validateSentenceParam = require('../../validator/sentenceValidator');

describe('sentence', function() {

  describe('get', function() {

    it('should return the first sentence', function (done) {


        gladys.sentence.get({take: 1, skip: 0})
            .then(function(result){
                validateSentenceParam(result);
                result.length.should.not.equal(0);
                done();
            }).catch(done);
        });
        
    });
    
});