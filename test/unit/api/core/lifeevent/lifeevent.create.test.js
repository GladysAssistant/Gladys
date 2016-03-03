var should = require('should');
var validateLifeEvent = require('../../validator/lifeEventValidator.js');

describe('LifeEvent', function() {

  describe('create', function() {
    
    it('should return lifeEvent created', function (done) {
     	 
          var lifeEvent = {
            datetime: '2014-11-03 19:43:37',
            code: 'wakeup',
            user: 1
          };
          
          gladys.lifeEvent.create(lifeEvent)
                .then(function(result){
                    validateLifeEvent(result);
                    done();
                }).catch(done);
    });
    
  });

});