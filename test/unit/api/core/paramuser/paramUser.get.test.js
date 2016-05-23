var should = require('should');
var validateParamUser = require('../../validator/paramUserValidator.js');

describe('ParamUser', function() {

  describe('get', function() {
    
    it('should return paramUsers', function (done) {
          
          var user = {id: 1};
          gladys.paramUser.get(user)
                .then(function(paramUsers){
                    validateParamUser(paramUsers);
                    done();
                })
                .catch(done);
    });
    
  });

});