var should = require('should');
var validateLauncherParam = require('../../validator/launcherParamValidator.js');

describe('LauncherParam', function() {

  describe('insertBatch', function() {
    
    it('should insert multiple params', function (done) {
        
        var tab = [
           {
                "name": "DeviceType",
                "variablename": "devicetype",
                "path": "/devicetype"
            },
            {
                "name": "Value",
                "variablename": "value"
            }
        ];
        
        gladys.launcherParam.insertBatch(1, tab)
              .then(function(result){
                validateLauncherParam(result);
                done();
            }).catch(function(err){
                done(err);
            });

    });
    
  });

});