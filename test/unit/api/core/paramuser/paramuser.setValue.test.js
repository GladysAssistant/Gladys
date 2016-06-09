var should = require('should');
var validateParamUser = require('../../validator/paramUserValidator.js');

describe('ParamUser', function() {

  describe('setValue', function() {
    
    it('should return new paramUser created', function (done) {
     	 
          var param = {
             name: 'dsfsdf',
             value: 'Awesome value',
             user: 1
          };
          
          gladys.paramUser.setValue(param)
                .then(function(newParam){
                    validateParamUser(newParam);
                    newParam.value.should.equal(param.value);
                    done();
                });
    });
    
    it('should return new paramUser updated', function (done) {
     	 
           var param = {
             name: 'test',
             value: 'Awesome value',
             user: 1
          };
          
          gladys.paramUser.setValue(param)
                .then(function(newParam){
                    validateParamUser(newParam);
                    newParam.value.should.equal(param.value);
                    done();
                });
    });
    
  });

});