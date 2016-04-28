var should = require('should');

describe('Scheduler', function() {

  describe('create', function() {
    
    it('should return index of scheduler created', function (done) {
     	 
          var obj = {
               event: {
                   code: 'test',
                   value: 'test',
               }, 
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
    
    it('should return error - no event specified', function (done) {
     	 
          var obj = {
               rule: {
                   hour: 14, 
                   minute: 30, 
                   dayOfWeek: 0
               }
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