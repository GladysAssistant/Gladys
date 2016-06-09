var should = require('should');
var validateBoxType = require('../../validator/boxTypeValidator.js');

describe('BoxType', function() {

  describe('create', function() {
    
    it('should return boxType created', function (done) {
     	
         var boxType = {
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