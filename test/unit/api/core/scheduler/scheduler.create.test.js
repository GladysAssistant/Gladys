var should = require('should');

describe('Scheduler', function() {

  describe('create', function() {
    
    it('should return index of scheduler created', function (done) {
     	 
          var obj = {
               eventName: 'test',
               value: 'test',
               rule: {
                   hour: 14, 
                   minute: 30, 
                   dayOfWeek: 0
               }
          };
          
          gladys.scheduler.create(obj)
                .then(function(index){
                    index.should.be.instanceOf(Number);
                    done();
                });
    });
    
    it('should return error - no eventName specified', function (done) {
     	 
          var obj = {
              
               value: 'test'
          };
          
          gladys.scheduler.create(obj)
                .then(function(index){
                    
                    done('No error detected');
                })
                .catch(function(err){
                   done(); 
                });
    });
    
  });

});