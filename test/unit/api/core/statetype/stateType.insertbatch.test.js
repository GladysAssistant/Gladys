var should = require('should');
var validateStateType = require('../../validator/stateTypeValidator.js');

describe('StateType', function() {

  describe('insertBatch', function() {
    
    it('should return batch of StateType created', function (done) {
     	
         var array = [
            {
                uuid: '6ae9bfb5-678f-4f3b-80d0-b3c77df38a8a',
                name: 'test',
                description:'test',
                service: 'test',
                function: 'test',
                params: [
                    {
                        variablename: 'test',
                        name: 'test',
                        path: '/test'
                    }
                ],
                templateParams: [
                    {
                        variablename: 'test',
                        name: 'test',
                        path: '/test'
                    }
                ]
            }
         ];
        
        gladys.stateType.insertBatch(array)
            .then(function(result){
                
                validateStateType(result);
                done();
            }).catch(done);

    });
   
  });

});