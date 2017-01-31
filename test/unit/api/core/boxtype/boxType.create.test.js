var should = require('should');
var validateBoxType = require('../../validator/boxTypeValidator.js');

describe('BoxType', function() {

  describe('create', function() {
    
    it('should return boxType created', function (done) {
     	
         var boxType = {
           uuid: 'dec933b6-2bf7-4b2b-9f65-198ef7f763e9',
           title: 'test',
           html:'test',
           icon:'fa fa-test',
           type: 'box box-info',
           view: 'dashboard'
        };
        
        gladys.boxType.create(boxType).then(function(result){
           validateBoxType(result);
           done();
        }).catch(function(err){
            done(err);
        });

    });
  
  });

});