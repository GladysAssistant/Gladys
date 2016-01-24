var should = require('should');

describe('Device', function() {

  describe('create', function() {
    
    it('should return correct device and device types created', function (done) {
     	var obj = {
             
            device: {
               name: 'Light in my room',
               protocol: 'milight',
               room: 1
            },
            
            types: [
                {
                    type: 'binary'
                },
                {
                    type:'multilevel',
                    unit: 'color',
                    min: 0,
                    max: 100
                }
            ]   
        };
        
        gladys.device.create(obj).then(function(result){
           result.should.have.property('device');
           result.should.have.property('types');
           result.device.should.have.property('id');
           result.types.should.be.instanceOf(Array);
           result.types[0].should.have.property('id');
           done();
        }).catch(function(err){
            done(err);
        });

    });
    
  });

});