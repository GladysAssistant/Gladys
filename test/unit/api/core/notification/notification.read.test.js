var should = require('should');

describe('Notification', function() {

  describe('read', function() {
    
    it('should set isRead to true for a specific user', function (done) {
        
        gladys.notification.read({id: 1}).then(function(result){
           result.should.be.instanceOf(Array);
           result.forEach(function(n){
               n.should.have.property('isRead', true);
           });
           done();
        }).catch(done);

    });
    
  });

});